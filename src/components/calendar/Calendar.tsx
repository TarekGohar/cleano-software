"use client";

import React, { useEffect } from "react";
import Button from "@/components/ui/Button";
import { useCalendar } from "@/components/calendar/CalendarContext";
import { useCalendarConfig } from "@/contexts/CalendarConfigContext";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { EventModals } from "@/components/calendar/EventModals";
import ZoomControls from "@/components/calendar/ZoomControls";
import { format, addDays, startOfWeek } from "@/components/calendar/utils";
import { CalendarRef, CalendarEvent } from "@/components/calendar/types";
import Card from "@/components/ui/Card";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface CalendarProps {
  initialDate?: Date;
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventAdd?: (event: CalendarEvent) => void;
  persist?: boolean;
  onEventsChange?: (events: CalendarEvent[]) => void;
}

const Calendar = React.forwardRef<CalendarRef, CalendarProps>((props, ref) => {
  const {
    view,
    setView,
    handlePrev,
    handleNext,
    handleToday,
    currentDate,
    openEventDetailsModal,
    setModalDate,
    setShowModal,
    events,
    movingEvent,
    finalizeEventMove,
    resizingEvent,
    resizeEdge,
    resizeStartY,
    resizeOriginalStart,
    resizeOriginalEnd,
    finalizeEventResize,
    setEvents,
    moveOriginalDate,
    moveStartX,
    moveStartY,
    setHasMoved,
    setMovingTdoEventPosition,
  } = useCalendar();

  const { config: calendarConfig } = useCalendarConfig();

  React.useImperativeHandle(ref, () => ({
    openEventModal: (date: Date) => {
      setModalDate(date);
      setShowModal(true);
      props.onDateSelect?.(date);
    },
    openEventDetailsModal: (event: CalendarEvent) => {
      openEventDetailsModal(event);
    },
  }));

  useEffect(() => {
    props.onEventsChange?.(events);
  }, [events, props.onEventsChange]);

  const getHeaderTitle = () => {
    if (view === "month" || view === "week")
      return format(currentDate, "MMMM yyyy");
    if (view === "day") return format(currentDate, "EEEE, d MMMM yyyy");
    return format(currentDate, "EEEE, d MMMM yyyy");
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (movingEvent && moveOriginalDate && moveStartY && moveStartX) {
        const deltaX = Math.abs(e.clientX - moveStartX);
        const deltaY = Math.abs(e.clientY - moveStartY);
        if (deltaX > 3 || deltaY > 3) {
          setHasMoved(true);
        }
        const calcNewTimes = () => {
          const deltaYFull = e.clientY - moveStartY;
          const originalMinutes =
            movingEvent.start.getHours() * 60 + movingEvent.start.getMinutes();
          const rawNewMinutes = originalMinutes + deltaYFull;
          const newMinutes = Math.max(
            0,
            Math.min(24 * 60 - 15, Math.round(rawNewMinutes / 15) * 15)
          );
          const newHour = Math.floor(newMinutes / 60);
          const newMin = newMinutes % 60;

          let baseDate = new Date(moveOriginalDate);
          let newRoom = movingEvent.label;

          if (view === "week") {
            // Query all day columns by their data attribute
            const dayColumns = document.querySelectorAll("[data-day-column]");
            if (dayColumns.length === 7) {
              // Find which day column the mouse is over
              for (let i = 0; i < dayColumns.length; i++) {
                const col = dayColumns[i] as HTMLElement;
                const rect = col.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right) {
                  const dayIndex = parseInt(
                    col.getAttribute("data-day-column") || "0",
                    10
                  );
                  const weekStartConst = startOfWeek(currentDate);
                  baseDate = addDays(weekStartConst, dayIndex);
                  break;
                }
              }
            }
          } else if (view === "day") {
            const roomColumns = document.querySelectorAll("[data-room-name]");
            if (roomColumns.length > 0) {
              let targetRoomName = null;

              for (let i = 0; i < roomColumns.length; i++) {
                const roomColumn = roomColumns[i] as HTMLElement;
                const rect = roomColumn.getBoundingClientRect();

                if (e.clientX >= rect.left && e.clientX <= rect.right) {
                  targetRoomName = roomColumn.getAttribute("data-room-name");
                  break;
                }
              }

              if (targetRoomName) {
                if (
                  targetRoomName === "Unassigned Events" ||
                  targetRoomName === "All Events"
                ) {
                  newRoom = undefined;
                } else {
                  newRoom = targetRoomName;
                }
              }
            }
          }

          const newStart = new Date(baseDate);
          newStart.setHours(newHour, newMin, 0, 0);

          let newEnd: Date | undefined;
          if (movingEvent.end) {
            const dur = movingEvent.end.getTime() - movingEvent.start.getTime();
            newEnd = new Date(newStart.getTime() + dur);
          }

          return { newStart, newEnd, newRoom };
        };

        const { newStart, newEnd, newRoom } = calcNewTimes();

        // Check if this is a TDO event
        const isTdoEvent = movingEvent.metadata?.isTdoAppointment;

        if (isTdoEvent) {
          // For TDO events, update the position through the dedicated state
          setMovingTdoEventPosition({
            id: movingEvent.id,
            start: newStart,
            end: newEnd,
            label: newRoom,
          });
        } else {
          // For local events, update through setEvents
          setEvents(
            events.map((ev: CalendarEvent) =>
              ev.id === movingEvent.id
                ? { ...ev, start: newStart, end: newEnd, label: newRoom }
                : ev
            )
          );
        }
      }

      if (resizingEvent && resizeStartY !== null && resizeEdge) {
        const deltaY = e.clientY - resizeStartY;
        const rawMinutes = Math.round(deltaY);
        const snappedMinutes = Math.round(rawMinutes / 15) * 15;

        const newEvents = events.map((ev) => {
          if (ev.id !== resizingEvent.id) return ev;
          let newStart = new Date(ev.start);
          let newEnd = ev.end ? new Date(ev.end) : undefined;

          if (resizeEdge === "start") {
            const candidate = new Date(
              resizeOriginalStart!.getTime() + snappedMinutes * 60000
            );
            if (
              newEnd &&
              candidate.getTime() <= newEnd.getTime() - 15 * 60000
            ) {
              newStart = candidate;
            }
          } else if (resizeEdge === "end") {
            const origEnd =
              resizeOriginalEnd ??
              new Date(resizeOriginalStart!.getTime() + 60 * 60000);
            const candidate = new Date(
              origEnd.getTime() + snappedMinutes * 60000
            );
            if (candidate.getTime() >= newStart.getTime() + 15 * 60000) {
              newEnd = candidate;
            }
          }

          return { ...ev, start: newStart, end: newEnd };
        });
        setEvents(newEvents);
      }
    };

    const handleGlobalMouseUp = () => {
      if (movingEvent) {
        finalizeEventMove();
      }
      if (resizingEvent) {
        finalizeEventResize();
      }
    };

    if (movingEvent || resizingEvent) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [
    movingEvent,
    resizingEvent,
    resizeStartY,
    resizeEdge,
    finalizeEventMove,
    finalizeEventResize,
    setEvents,
    setMovingTdoEventPosition,
    moveOriginalDate,
    moveStartX,
    moveStartY,
    setHasMoved,
    events,
    view,
    currentDate,
  ]);

  return (
    <div className="flex flex-col h-full select-none gap-4">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-white sticky top-0 z-10 p-4">
        <div className="w-full grid grid-cols-3 items-center">
          <div className="w-full flex items-center justify-start">
            <h2 className="h2-subtitle">{getHeaderTitle()}</h2>
          </div>

          <div className="w-full flex items-center justify-center">
            <div className="w-fit flex gap-1 rounded-2xl overflow-hidden bg-neutral-50">
              {(["month", "week", "day"] as const).map((v) => (
                <Button
                  key={v}
                  border={false}
                  variant={view === v ? "action" : "ghost"}
                  size="md"
                  className="text-[#005F6A] !px-6 !py-3"
                  onClick={() => setView(v)}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="w-full flex items-center justify-end gap-2">
            <Card className="!p-0 !w-fit flex items-center gap-1">
              <Button
                variant="ghost"
                size="md"
                className="px-6 py-3"
                onClick={handlePrev}>
                <ChevronLeft
                  className="w-4 h-4 text-[#005F6A]"
                  strokeWidth={1.5}
                />
              </Button>

              <Button
                variant="primary"
                size="md"
                border={false}
                onClick={handleToday}
                className="w-fit px-6 py-3">
                Today
              </Button>

              <Button
                variant="ghost"
                size="md"
                className="px-6 py-3"
                onClick={handleNext}>
                <ChevronRight
                  className="w-4 h-4 text-[#005F6A]"
                  strokeWidth={1.5}
                />
              </Button>
            </Card>
            <Button
              variant="primary"
              size="md"
              className="px-6 py-3"
              onClick={() => {
                setModalDate(currentDate);
                setShowModal(true);
              }}>
              <Plus className="w-4 h-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Calendar Body */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === "month" && <MonthView />}
        {view === "week" && <WeekView />}
        {view === "day" && <DayView />}
      </div>

      <EventModals />
    </div>
  );
});

Calendar.displayName = "Calendar";

export default Calendar;
