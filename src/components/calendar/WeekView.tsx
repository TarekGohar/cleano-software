"use client";

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useCalendar } from "./CalendarContext";
import { useCalendarConfig } from "@/contexts/CalendarConfigContext";
import {
  startOfWeek,
  addDays,
  isSameDay,
  eventOverlapsDay,
  hexToRgba,
} from "./utils";
import { CalendarEvent } from "./types";
import {
  getEventStyleInfo,
  getEventBackgroundColor,
  getEventBoxShadow,
  getBlockStripeStyle,
  EventTypesConfig,
} from "./event-styles";
import {
  MIN_EVENT_HEIGHT,
  MIN_BLOCK_HEIGHT,
  DRAG_THRESHOLD,
  OfficeHours,
  getVisibleTimeBounds,
  calculateEventPosition,
  getBorderRadiusClasses,
  computeEventLayout,
  formatHour,
} from "./calendar-helpers";
import { ResizeHandles, CurrentTimeIndicator } from "./calendar-components";
import { ScheduleBlocksConfig } from "@/types/calendar";
import { getBlockedTimeSlots } from "@/lib/schedule-blocks";
import Button from "@/components/ui/Button";

/** Selection preview overlay during drag */
const SelectionPreview: React.FC<{
  start: { day: Date; minutes: number };
  end: { day: Date; minutes: number };
  weekDays: Date[];
  zoomLevel: number;
  officeHours: OfficeHours | null;
}> = ({ start, end, weekDays, zoomLevel, officeHours }) => {
  // Calculate which days are selected
  const startDayIndex = weekDays.findIndex(
    (d) => d.toDateString() === start.day.toDateString()
  );
  const endDayIndex = weekDays.findIndex(
    (d) => d.toDateString() === end.day.toDateString()
  );

  if (startDayIndex === -1 || endDayIndex === -1) return null;

  // Normalize direction
  const minDayIndex = Math.min(startDayIndex, endDayIndex);
  const maxDayIndex = Math.max(startDayIndex, endDayIndex);

  // Calculate time bounds
  let startMinutes = start.minutes;
  let endMinutes = end.minutes;

  // For single-day selection, normalize the order
  if (startDayIndex === endDayIndex) {
    if (endMinutes < startMinutes) {
      [startMinutes, endMinutes] = [endMinutes, startMinutes];
    }
  } else {
    // For multi-day, use the earlier day's time as start
    if (startDayIndex > endDayIndex) {
      startMinutes = end.minutes;
      endMinutes = start.minutes;
    }
  }

  const officeStart = officeHours?.start || 0;

  // Convert minutes to pixel position
  const minutesToTop = (mins: number) => {
    const hoursFromOfficeStart = (mins - officeStart * 60) / 60;
    return hoursFromOfficeStart * zoomLevel;
  };

  const previews: React.ReactNode[] = [];

  for (let dayIndex = minDayIndex; dayIndex <= maxDayIndex; dayIndex++) {
    let dayStartMinutes: number;
    let dayEndMinutes: number;

    if (minDayIndex === maxDayIndex) {
      // Single day selection
      dayStartMinutes = startMinutes;
      dayEndMinutes = endMinutes;
    } else if (dayIndex === minDayIndex) {
      // First day of multi-day selection
      dayStartMinutes =
        startDayIndex < endDayIndex ? startMinutes : endMinutes - 15;
      dayEndMinutes = (officeHours?.end || 24) * 60;
    } else if (dayIndex === maxDayIndex) {
      // Last day of multi-day selection
      dayStartMinutes = (officeHours?.start || 0) * 60;
      dayEndMinutes =
        startDayIndex < endDayIndex ? endMinutes : startMinutes + 15;
    } else {
      // Middle days - full day
      dayStartMinutes = (officeHours?.start || 0) * 60;
      dayEndMinutes = (officeHours?.end || 24) * 60;
    }

    const top = minutesToTop(dayStartMinutes);
    const bottom = minutesToTop(dayEndMinutes);
    const height = Math.max(bottom - top, zoomLevel / 4); // Minimum height

    previews.push(
      <div
        key={dayIndex}
        className="absolute z-40 pointer-events-none bg-[#005F6A]/[0.08]"
        style={{
          left: `${(dayIndex / 7) * 100}%`,
          width: `${100 / 7}%`,
          top: `${top}px`,
          height: `${height}px`,
        }}
      />
    );
  }

  return <>{previews}</>;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const WeekView: React.FC = () => {
  // ---------------------------------------------------------------------------
  // Context & Config
  // ---------------------------------------------------------------------------
  const {
    currentDate,
    events,
    zoomLevel,
    eventsLoading,
    setMovingEvent,
    setMoveOriginalDate,
    setMouseDownTime,
    setHasMoved,
    setClickedEvent,
    movingEvent,
    setMoveStartX,
    setMoveStartY,
    previewEvent,
    openModalWithPreset,
    openEventModalAtTime,
    setResizingEvent,
    setResizeEdge,
    setResizeStartY,
    setResizeOriginalStart,
    setResizeOriginalEnd,
    openEventDetailsModal,
    openEventModal,
    // Drag selection state
    isDraggingSelection,
    setIsDraggingSelection,
    dragSelectionStart,
    setDragSelectionStart,
    dragSelectionEnd,
    setDragSelectionEnd,
    dragStartPosition,
    setDragStartPosition,
  } = useCalendar();

  const { config: calendarConfig } = useCalendarConfig();

  // ---------------------------------------------------------------------------
  // Derived Config
  // ---------------------------------------------------------------------------
  const scheduleBlocks =
    ((calendarConfig as any)?.scheduleBlocks as ScheduleBlocksConfig) || {};
  const eventTypesConfig = (calendarConfig?.eventTypes ||
    {}) as EventTypesConfig;
  const use24HourClock = !!calendarConfig?.use24HourClock;

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const weekGridRef = useRef<HTMLDivElement>(null);
  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  /** Timezone label (e.g., "GMT+2") */
  const timezoneLabel = useMemo(() => {
    const offset = -new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const sign = offset >= 0 ? "+" : "-";
    return `GMT${sign}${hours}`;
  }, []);

  /** Office hours configuration */
  const officeHours = useMemo((): OfficeHours | null => {
    if (
      !calendarConfig?.hideNonOfficeHours ||
      !calendarConfig?.officeHoursStart ||
      !calendarConfig?.officeHoursEnd
    ) {
      return null;
    }
    const start = parseInt(calendarConfig.officeHoursStart.split(":")[0], 10);
    const end = parseInt(calendarConfig.officeHoursEnd.split(":")[0], 10);
    if (start >= 0 && start <= 23 && end >= 0 && end <= 23 && start < end) {
      return { start, end };
    }
    return null;
  }, [calendarConfig]);

  /** Array of visible hours */
  const visibleHours = useMemo(
    () =>
      officeHours
        ? Array.from(
            { length: officeHours.end - officeHours.start + 1 },
            (_, i) => i + officeHours.start
          )
        : Array.from({ length: 25 }, (_, i) => i),
    [officeHours]
  );

  /** Total grid height in pixels */
  const gridHeight = visibleHours.length * zoomLevel;

  /** Week start date and array of 7 days */
  const weekStart = startOfWeek(currentDate);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  /** Current time info */
  const currentHour = currentTime.getHours();
  const currentMin = currentTime.getMinutes();

  /** Whether current time indicator should be visible */
  const showCurrentTimeIndicator = useMemo(() => {
    const isCurrentWeek = weekDays.some((day) => isSameDay(day, currentTime));
    const isWithinOfficeHours =
      !officeHours ||
      (currentHour >= officeHours.start && currentHour <= officeHours.end);
    return isCurrentWeek && isWithinOfficeHours;
  }, [weekDays, currentTime, currentHour, officeHours]);

  /** Current time indicator position */
  const currentTimeTop = useMemo(() => {
    const officeStart = officeHours?.start || 0;
    return (
      (currentHour - officeStart) * zoomLevel + (currentMin * zoomLevel) / 60
    );
  }, [currentHour, currentMin, officeHours, zoomLevel]);

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /** Check if an event can be resized */
  const isEventResizable = useCallback((event: CalendarEvent): boolean => {
    if (event.metadata?.jobId) return true;
    return !event.metadata?.selectedEventType;
  }, []);

  /** Handle mouse down on an event (start drag or open details) */
  const handleEventMouseDown = useCallback(
    (e: React.MouseEvent, event: CalendarEvent, originalDate: Date) => {
      e.stopPropagation();

      setMouseDownTime(Date.now());
      setHasMoved(false);
      setClickedEvent(event);
      setMovingEvent(event);
      setMoveOriginalDate(originalDate);
      setMoveStartX(e.clientX);
      setMoveStartY(e.clientY);
      console.log("[WeekView] mousedown event", {
        id: event.id,
        title: event.title,
        originalDate,
        start: event.start,
        end: event.end,
      });
    },
    [
      setMouseDownTime,
      setHasMoved,
      setClickedEvent,
      setMovingEvent,
      setMoveOriginalDate,
      setMoveStartX,
      setMoveStartY,
    ]
  );

  /** Handle resize start */
  const handleResizeStart = useCallback(
    (event: CalendarEvent, edge: "start" | "end", e: React.MouseEvent) => {
      setResizingEvent(event);
      setResizeEdge(edge);
      setResizeStartY(e.clientY);
      setResizeOriginalStart(event.start);
      setResizeOriginalEnd(
        event.end ?? new Date(event.start.getTime() + 60 * 60000)
      );
    },
    [
      setResizingEvent,
      setResizeEdge,
      setResizeStartY,
      setResizeOriginalStart,
      setResizeOriginalEnd,
    ]
  );

  // ---------------------------------------------------------------------------
  // Drag Selection Handlers
  // ---------------------------------------------------------------------------

  /** Convert Y position within grid to minutes from midnight */
  const yPositionToMinutes = useCallback(
    (y: number): number => {
      // Grid height is visibleHours.length * zoomLevel
      const maxY = visibleHours.length * zoomLevel;
      const clampedY = Math.max(0, Math.min(maxY, y));
      // Each pixel represents (60 / zoomLevel) minutes
      const fractionalHours = clampedY / zoomLevel;
      const minutesFromTop = fractionalHours * 60;
      const totalMinutes = minutesFromTop + (officeHours?.start || 0) * 60;
      // Snap to 15-minute intervals
      return Math.floor(totalMinutes / 15) * 15;
    },
    [zoomLevel, officeHours, visibleHours.length]
  );

  /** Determine which day column the mouse is over based on X position */
  const getDayFromXPosition = useCallback(
    (clientX: number): Date | null => {
      for (let i = 0; i < dayColumnRefs.current.length; i++) {
        const colEl = dayColumnRefs.current[i];
        if (colEl) {
          const rect = colEl.getBoundingClientRect();
          if (clientX >= rect.left && clientX <= rect.right) {
            return weekDays[i];
          }
        }
      }
      return null;
    },
    [weekDays]
  );

  /** Handle mouse down on 15-minute tile - start drag selection */
  const handleDragSelectionStart = useCallback(
    (
      e: React.MouseEvent,
      day: Date,
      hourIndex: number,
      minuteOffset: number = 0
    ) => {
      // Don't start drag if clicking on an event
      if ((e.target as HTMLElement).closest("[data-event-card]")) {
        return;
      }

      // The actual hour for this row
      const actualHour = visibleHours[hourIndex];
      // Total minutes from midnight (start of this 15-minute tile)
      const startMinutes = actualHour * 60 + minuteOffset;

      setDragStartPosition({ x: e.clientX, y: e.clientY });
      setDragSelectionStart({ day, minutes: startMinutes });
      setDragSelectionEnd({ day, minutes: startMinutes + 15 }); // Initial selection of 15 minutes
    },
    [
      visibleHours,
      setDragStartPosition,
      setDragSelectionStart,
      setDragSelectionEnd,
    ]
  );

  /** Handle mouse move during drag selection */
  const handleDragSelectionMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartPosition || !dragSelectionStart) return;

      // Check if we've moved beyond threshold
      const deltaX = Math.abs(e.clientX - dragStartPosition.x);
      const deltaY = Math.abs(e.clientY - dragStartPosition.y);

      if (
        !isDraggingSelection &&
        (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD)
      ) {
        setIsDraggingSelection(true);
      }

      if (
        !isDraggingSelection &&
        deltaX <= DRAG_THRESHOLD &&
        deltaY <= DRAG_THRESHOLD
      ) {
        return;
      }

      // Find which day column the mouse is over
      const day = getDayFromXPosition(e.clientX);
      if (!day) return;

      // Calculate minutes from Y position relative to the grid
      const gridEl = weekGridRef.current;
      if (!gridEl) return;

      const gridRect = gridEl.getBoundingClientRect();
      const y = e.clientY - gridRect.top;
      const minutes = yPositionToMinutes(y);

      // Update end position (already snapped in yPositionToMinutes, add 15 for the end)
      setDragSelectionEnd({ day, minutes: minutes + 15 });
    },
    [
      dragStartPosition,
      dragSelectionStart,
      isDraggingSelection,
      setIsDraggingSelection,
      getDayFromXPosition,
      yPositionToMinutes,
      setDragSelectionEnd,
    ]
  );

  /** Handle mouse up - finalize drag selection */
  const handleDragSelectionEnd = useCallback(
    (e: MouseEvent) => {
      if (!dragSelectionStart) {
        // Reset state
        setDragStartPosition(null);
        setDragSelectionStart(null);
        setDragSelectionEnd(null);
        setIsDraggingSelection(false);
        return;
      }

      const wasDragging = isDraggingSelection;

      // Reset drag state
      setIsDraggingSelection(false);
      setDragStartPosition(null);

      if (!wasDragging) {
        // This was a simple click, not a drag
        // Use the 15-minute tile values that were set on mouse down
        const startMinutes = dragSelectionStart.minutes;
        const endMinutes = dragSelectionEnd?.minutes ?? startMinutes + 15;

        // Convert minutes to time strings
        const toTimeStr = (mins: number) => {
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          return `${h.toString().padStart(2, "0")}:${m
            .toString()
            .padStart(2, "0")}`;
        };

        const startTimeStr = toTimeStr(startMinutes);
        const endTimeStr = toTimeStr(endMinutes);

        // Clear selection state
        setDragSelectionStart(null);
        setDragSelectionEnd(null);

        // Open the modal with the 15-minute tile range
        openEventModal(dragSelectionStart.day, startTimeStr, endTimeStr);
        return;
      }

      // This was a drag - calculate the selection range
      const selectionEnd = dragSelectionEnd;
      if (!selectionEnd) {
        setDragSelectionStart(null);
        setDragSelectionEnd(null);
        return;
      }

      // Determine start and end, handling backward selections
      let startDay = dragSelectionStart.day;
      let startMinutes = dragSelectionStart.minutes;
      let endDay = selectionEnd.day;
      let endMinutes = selectionEnd.minutes;

      // Compare dates and swap if needed for cross-day selections
      const startTime = startDay.getTime() + startMinutes * 60000;
      const endTime = endDay.getTime() + endMinutes * 60000;

      if (endTime < startTime) {
        // Swap start and end
        [startDay, endDay] = [endDay, startDay];
        [startMinutes, endMinutes] = [endMinutes - 15, startMinutes + 15];
      }

      // Convert minutes to time strings
      const toTimeStr = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`;
      };

      const startTimeStr = toTimeStr(startMinutes);
      const endTimeStr = toTimeStr(endMinutes);

      // Clear selection state
      setDragSelectionStart(null);
      setDragSelectionEnd(null);

      // Open the modal with the selected range
      // For now, use the start day as the date (cross-day events would need more complex handling)
      openEventModal(startDay, startTimeStr, endTimeStr);
    },
    [
      dragSelectionStart,
      dragSelectionEnd,
      isDraggingSelection,
      setIsDraggingSelection,
      setDragStartPosition,
      setDragSelectionStart,
      setDragSelectionEnd,
      getDayFromXPosition,
      openEventModalAtTime,
      openEventModal,
      officeHours,
      zoomLevel,
    ]
  );

  // Attach document event listeners for drag selection
  useEffect(() => {
    if (dragStartPosition) {
      document.addEventListener("mousemove", handleDragSelectionMove);
      document.addEventListener("mouseup", handleDragSelectionEnd);

      return () => {
        document.removeEventListener("mousemove", handleDragSelectionMove);
        document.removeEventListener("mouseup", handleDragSelectionEnd);
      };
    }
  }, [dragStartPosition, handleDragSelectionMove, handleDragSelectionEnd]);

  /** Handle preset drop from sidebar */
  const handlePresetDrop = useCallback(
    (e: React.DragEvent, day: Date) => {
      e.preventDefault();
      const preset = JSON.parse(e.dataTransfer.getData("application/json"));
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;

      // Snap to 15-minute intervals
      const clamped = Math.max(0, Math.min(rect.height, y));
      const snappedY = Math.round(clamped / 15) * 15;

      // Convert Y position to time
      const totalMinutes =
        Math.max(
          0,
          Math.min((visibleHours.length - 1) * 60, Math.round(snappedY))
        ) +
        (officeHours?.start || 0) * 60;
      const startTime = new Date(day);
      startTime.setHours(
        Math.floor(totalMinutes / 60),
        totalMinutes % 60,
        0,
        0
      );

      openModalWithPreset(preset, startTime);
    },
    [visibleHours.length, officeHours, openModalWithPreset]
  );

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  /** Render schedule blocks for a day */
  const renderScheduleBlocks = useCallback(
    (day: Date) => {
      const blockedSlots = getBlockedTimeSlots(day, scheduleBlocks);
      const { start: visibleStart, end: visibleEnd } = getVisibleTimeBounds(
        day,
        officeHours
      );

      return blockedSlots
        .map((block) => {
          const [startHour, startMin] = block.startTime.split(":").map(Number);
          const [endHour, endMin] = block.endTime.split(":").map(Number);

          const blockStart = new Date(day);
          blockStart.setHours(startHour, startMin, 0, 0);
          const blockEnd = new Date(day);
          blockEnd.setHours(endHour, endMin, 0, 0);

          // Skip blocks outside visible range
          if (
            blockStart.getTime() >= visibleEnd.getTime() ||
            blockEnd.getTime() <= visibleStart.getTime()
          ) {
            return null;
          }

          // Clip to visible boundaries
          const segStart = new Date(
            Math.max(blockStart.getTime(), visibleStart.getTime())
          );
          const segEnd = new Date(
            Math.min(blockEnd.getTime(), visibleEnd.getTime())
          );

          const officeStart = officeHours?.start || 0;
          const top =
            (segStart.getHours() - officeStart) * zoomLevel +
            (segStart.getMinutes() * zoomLevel) / 60;
          const height = Math.max(
            MIN_BLOCK_HEIGHT,
            (segEnd.getHours() - segStart.getHours()) * zoomLevel +
              ((segEnd.getMinutes() - segStart.getMinutes()) * zoomLevel) / 60
          );

          const blockColor = block.color || "#EF4444";

          return (
            <div
              key={`${block.id}-${day.toISOString()}`}
              className="absolute left-0 right-0 z-10 border-l-2 pointer-events-none"
              style={{
                backgroundColor: hexToRgba(blockColor, 0.15),
                borderColor: hexToRgba(blockColor, 0.3),
                top: `${top}px`,
                height: `${height}px`,
              }}
              title={`${block.title} (${block.startTime} - ${block.endTime})`}>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-xs font-medium px-1 py-0.5 rounded bg-white/70"
                  style={{ color: blockColor }}>
                  {block.title}
                </span>
              </div>
            </div>
          );
        })
        .filter(Boolean);
    },
    [scheduleBlocks, officeHours, zoomLevel]
  );

  /** Render a single event card */
  const renderEventCard = useCallback(
    (
      event: CalendarEvent,
      day: Date,
      layout: { index: number; total: number }
    ) => {
      const position = calculateEventPosition(
        event,
        day,
        officeHours,
        zoomLevel,
        layout
      );
      if (!position) return null;

      const styleInfo = getEventStyleInfo(event, eventTypesConfig);
      const { start: visibleStart, end: visibleEnd } = getVisibleTimeBounds(
        day,
        officeHours
      );

      // Calculate segment bounds for border radius
      const eventEnd =
        event.end || new Date(event.start.getTime() + 60 * 60 * 1000);
      const segStart = new Date(
        Math.max(event.start.getTime(), visibleStart.getTime())
      );
      const segEnd = new Date(
        Math.min((event.end || eventEnd).getTime(), visibleEnd.getTime())
      );
      const borderRadiusClasses = getBorderRadiusClasses(
        event,
        segStart,
        segEnd
      );

      const isBeingMoved =
        movingEvent?.id === event.id || event.id === "preview";
      const canResize = event.id !== "preview" && isEventResizable(event);

      return (
        <Button
          key={event.id}
          variant="primary"
          border={false}
          data-event-card
          className={`
            absolute flex flex-col justify-start items-start px-2 z-30 overflow-hidden transition-none
            ${position.height > MIN_EVENT_HEIGHT ? "py-1" : "py-0"}
            ${isBeingMoved ? "opacity-70" : ""}
            ${borderRadiusClasses}
            cursor-move
          `}
          style={{
            backgroundColor: getEventBackgroundColor(styleInfo),
            top: `${position.top + 0.5}px`,
            height: `${position.height}px`,
            left: position.left,
            width: position.width,
            boxShadow: getEventBoxShadow(styleInfo),
          }}
          onMouseDown={(e) => handleEventMouseDown(e, event, day)}>
          {/* Diagonal stripes overlay for blocks */}
          {styleInfo.isBlock && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={getBlockStripeStyle(styleInfo.color)}
            />
          )}

          {canResize && (
            <ResizeHandles
              onResizeStart={(edge, e) => handleResizeStart(event, edge, e)}
            />
          )}

          <div
            className="app-title-small truncate"
            style={{ color: styleInfo.color }}>
            {event.title}
            {event.metadata?.jobId && event.metadata?.status && (
              <span
                className="ml-1 text-[10px] px-1 py-0.5 rounded"
                style={{
                  backgroundColor: styleInfo.color + "30",
                }}>
                {event.metadata.status.replace("_", " ").slice(0, 4)}
              </span>
            )}
          </div>

          {position.height > 30 && event.label && (
            <div
              className="app-subtitle truncate"
              style={{ color: styleInfo.color }}>
              {event.label}
            </div>
          )}

          {position.height > 50 && event.metadata?.location && (
            <div
              className="app-subtitle truncate text-[10px]"
              style={{ color: styleInfo.color, opacity: 0.7 }}>
              📍 {event.metadata.location}
            </div>
          )}
        </Button>
      );
    },
    [
      officeHours,
      zoomLevel,
      eventTypesConfig,
      movingEvent,
      isEventResizable,
      handleEventMouseDown,
      handleResizeStart,
    ]
  );

  const renderSkeletonEvents = useCallback(
    (dayIndex: number) => {
      if (!eventsLoading) return null;
      // Render 3 placeholder blocks per day
      return [0, 1, 2].map((i) => {
        const top = 20 + i * (zoomLevel * 1.2);
        const height = Math.max(MIN_EVENT_HEIGHT, zoomLevel * 0.8);
        return (
          <div
            key={`skeleton-${dayIndex}-${i}`}
            className="absolute z-20 left-1 right-1 rounded-lg bg-[#005F6A]/10 animate-pulse"
            style={{
              top,
              height,
            }}
          />
        );
      });
    },
    [eventsLoading, zoomLevel]
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      {/* Header Row - Fixed */}
      <div className="flex-shrink-0 flex pb-0 px-4 overflow-x-auto">
        {/* Timezone Label */}
        <div className="w-10 flex-shrink-0 flex flex-col items-center justify-end py-3">
          <span className="app-subtitle !text-[#005F6A]/50">
            {timezoneLabel}
          </span>
        </div>

        {/* Day Headers */}
        <div className="flex-1 flex bg-transparent min-w-fit">
          {weekDays.map((day) => {
            const isToday = isSameDay(day, currentTime);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={day.toISOString()}
                className={`flex items-baseline gap-1 p-2 rounded-xl min-w-[120px] flex-1 ${
                  isToday
                    ? "bg-[#005F6A]/10"
                    : isWeekend
                    ? "bg-[#005F6A]/[0]"
                    : ""
                }`}>
                <span
                  className={`app-title ${
                    isToday ? "text-[#005F6A]" : "text-[#005F6A]/70"
                  }`}>
                  {day.getDate()}
                </span>
                <span className="app-subtitle !text-[#005F6A]/60">
                  {day.toLocaleString("default", { weekday: "short" })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Grid - Scrollable */}
      <div className="flex flex-1 overflow-y-auto overflow-x-auto p-4">
        {/* Time Labels Column */}
        <div className="w-10 flex-shrink-0 flex flex-col select-none">
          {visibleHours.map((hour) => (
            <div
              key={hour}
              className="relative flex-shrink-0"
              style={{ height: `${zoomLevel}px` }}>
              <span className="absolute right-0 pr-2 z-[1000] section-title !lowercase !text-[#005F6A]/30 text-right -translate-y-1/2">
                {formatHour(hour, use24HourClock)}
              </span>
            </div>
          ))}
        </div>

        {/* Days Grid Container */}
        <div className="flex-1 relative" ref={weekGridRef}>
          <div className="flex relative" data-week-grid="true">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 pointer-events-none">
              {visibleHours.map((hour) => (
                <React.Fragment key={hour}>
                  {/* Hour line */}
                  <div
                    className="absolute left-0 right-0 border-t-1 border-[#005F6A]/5"
                    style={{
                      top: `${
                        (hour - (officeHours?.start || 0)) * zoomLevel
                      }px`,
                    }}
                  />
                  {/* 15-minute interval lines */}
                  {[15, 30, 45].map((minutes) => (
                    <div
                      key={`${hour}-${minutes}`}
                      className="absolute left-0 right-0 border-t-1 border-[#005F6A]/[0.025]"
                      style={{
                        top: `${
                          (hour - (officeHours?.start || 0)) * zoomLevel +
                          (minutes * zoomLevel) / 60
                        }px`,
                      }}
                    />
                  ))}
                </React.Fragment>
              ))}

              {/* Current Time Indicator */}
              {showCurrentTimeIndicator && (
                <CurrentTimeIndicator top={currentTimeTop} />
              )}

              {/* Drag Selection Preview */}
              {isDraggingSelection &&
                dragSelectionStart &&
                dragSelectionEnd && (
                  <SelectionPreview
                    start={dragSelectionStart}
                    end={dragSelectionEnd}
                    weekDays={weekDays}
                    zoomLevel={zoomLevel}
                    officeHours={officeHours}
                  />
                )}
            </div>

            {/* Day Columns */}
            {weekDays.map((day, index) => {
              // Collect events for this day (including preview)
              const dayEvents = [
                ...events,
                ...(previewEvent && eventOverlapsDay(previewEvent, day)
                  ? [previewEvent]
                  : []),
              ].filter((event) => eventOverlapsDay(event, day));

              const layoutMap = computeEventLayout(
                dayEvents,
                movingEvent?.id ?? null
              );

              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <div
                  key={day.toISOString()}
                  ref={(el) => {
                    dayColumnRefs.current[index] = el;
                  }}
                  data-day-column={index}
                  className={`relative min-w-[120px] flex-1 ${
                    index > 0 ? "border-l border-[#005F6A]/10" : ""
                  } ${isWeekend ? "bg-[#005F6A]/[0.02]" : ""}`}
                  style={{ minHeight: `${gridHeight}px` }}
                  onDrop={(e) => handlePresetDrop(e, day)}
                  onDragOver={(e) => e.preventDefault()}>
                  {/* Skeletons */}
                  {eventsLoading && renderSkeletonEvents(index)}

                  {/* Schedule Blocks */}
                  {renderScheduleBlocks(day)}

                  {/* Events */}
                  {dayEvents.map((event) => {
                    const layout = layoutMap[event.id];
                    if (!layout) return null;
                    return renderEventCard(event, day, layout);
                  })}

                  {/* 15-Minute Tile Drag Handlers with Hover Effect */}
                  {visibleHours.flatMap((hour, hourIndex) =>
                    [0, 15, 30, 45].map((minutes) => (
                      <div
                        key={`${hour}-${minutes}`}
                        className={`absolute left-0 right-0 z-20 transition-colors duration-200 ${
                          isDraggingSelection
                            ? "cursor-crosshair"
                            : "cursor-pointer hover:bg-[#005F6A]/[0.06]"
                        }`}
                        style={{
                          top: `${
                            hourIndex * zoomLevel + (minutes * zoomLevel) / 60
                          }px`,
                          height: `${zoomLevel / 4}px`,
                        }}
                        onMouseDown={(e) =>
                          handleDragSelectionStart(e, day, hourIndex, minutes)
                        }
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
