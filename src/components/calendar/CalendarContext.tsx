"use client";

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  FormEvent,
  useCallback,
} from "react";
import { CalendarEvent } from "@/components/calendar/types";
import {
  startOfMonth,
  endOfMonth,
  addDays,
  startOfWeek,
  subMonths,
  addMonths,
  format,
} from "@/components/calendar/utils";
import { useCalendarConfig } from "@/contexts/CalendarConfigContext";

interface CalendarState {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: "month" | "week" | "day";
  setView: (view: "month" | "week" | "day") => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;

  showModal: boolean;
  setShowModal: (show: boolean) => void;
  modalDate: Date | null;
  setModalDate: (date: Date | null) => void;
  showEventModal: boolean;
  setShowEventModal: (show: boolean) => void;
  selectedEvent: CalendarEvent | null;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  editingEvent: CalendarEvent | null;
  setEditingEvent: (event: CalendarEvent | null) => void;
  handlePrev: () => void;
  handleNext: () => void;
  handleToday: () => void;
  handleAddEvent: (e: FormEvent) => Promise<void>;
  openEditModal: (event: CalendarEvent) => void;
  modalTitle: string;
  setModalTitle: (title: string) => void;
  modalDescription: string;
  setModalDescription: (description: string) => void;
  modalLabel: string;
  setModalLabel: (label: string) => void;
  modalPatientId: string;
  setModalPatientId: (id: string) => void;
  modalPatientFirstName: string;
  setModalPatientFirstName: (name: string) => void;
  modalPatientLastName: string;
  setModalPatientLastName: (name: string) => void;
  modalPatientDOB: string;
  setModalPatientDOB: (dob: string) => void;
  modalPatientPhone: string;
  setModalPatientPhone: (phone: string) => void;
  modalEventType: string;
  setModalEventType: (type: string) => void;
  modalSelectedEventType: string;
  setModalSelectedEventType: (type: string) => void;
  modalConfirmed: boolean;
  setModalConfirmed: (confirmed: boolean) => void;
  modalLocation: string;
  setModalLocation: (location: string) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  movingEvent: CalendarEvent | null;
  setMovingEvent: (event: CalendarEvent | null) => void;
  hasMoved: boolean;
  setHasMoved: (moved: boolean) => void;
  clickedEvent: CalendarEvent | null;
  setClickedEvent: (event: CalendarEvent | null) => void;
  mouseDownTime: number | null;
  setMouseDownTime: (time: number | null) => void;
  moveOriginalDate: Date | null;
  setMoveOriginalDate: (date: Date | null) => void;
  moveStartX: number | null;
  setMoveStartX: (x: number | null) => void;
  moveStartY: number | null;
  setMoveStartY: (y: number | null) => void;
  finalizeEventMove: () => Promise<void>;
  resetEventMove: () => void;
  openEventDetailsModal: (event: CalendarEvent) => void;

  previewEvent: CalendarEvent | null;
  setPreviewEvent: (event: CalendarEvent | null) => void;
  openModalWithPreset: (preset: any, startTime: Date) => void;
  handleDeleteEvent: (id: string) => Promise<void>;
  resizingEvent: CalendarEvent | null;
  setResizingEvent: (event: CalendarEvent | null) => void;
  resizeEdge: "start" | "end" | null;
  setResizeEdge: (edge: "start" | "end" | null) => void;
  resizeStartY: number | null;
  setResizeStartY: (y: number | null) => void;
  resizeOriginalStart: Date | null;
  setResizeOriginalStart: (date: Date | null) => void;
  resizeOriginalEnd: Date | null;
  setResizeOriginalEnd: (date: Date | null) => void;
  finalizeEventResize: () => Promise<void>;
  openEventModal: (
    date: Date,
    startTimeStr?: string,
    endTimeStr?: string
  ) => void;
  openEventModalAtTime: (
    date: Date,
    yPosition: number,
    containerHeight: number,
    officeHours?: { start: number; end: number },
    zoomLevel?: number
  ) => void;
  recommendations: any[];
  setRecommendations: (recommendations: any[]) => void;
  recommendationsLoading: boolean;
  setRecommendationsLoading: (loading: boolean) => void;
  generateRecommendations: () => void;
  selectRecommendation: (recommendation: any) => void;
  refreshEvents: () => Promise<void>;
  showNotification: (
    type: "success" | "error" | "loading",
    title: string,
    message: string
  ) => void;

  // TDO appointments
  tdoAppointments: any[];
  tdoLoading: boolean;
  tdoError: string | null;
  hasTdoAccess: boolean | null;

  // Prefetching control
  prefetchEnabled: boolean;
  setPrefetchEnabled: (enabled: boolean) => void;

  // Drag selection state for creating events
  isDraggingSelection: boolean;
  setIsDraggingSelection: (dragging: boolean) => void;
  dragSelectionStart: { day: Date; minutes: number } | null;
  setDragSelectionStart: (start: { day: Date; minutes: number } | null) => void;
  dragSelectionEnd: { day: Date; minutes: number } | null;
  setDragSelectionEnd: (end: { day: Date; minutes: number } | null) => void;
  dragStartPosition: { x: number; y: number } | null;
  setDragStartPosition: (pos: { x: number; y: number } | null) => void;

  // TDO event move state
  movingTdoEventPosition: {
    id: string;
    start: Date;
    end?: Date;
    label?: string | null;
  } | null;
  setMovingTdoEventPosition: (
    pos: { id: string; start: Date; end?: Date; label?: string | null } | null
  ) => void;
}

const CalendarContext = createContext<CalendarState | undefined>(undefined);

export const CalendarProvider = ({
  children,
  initialDate = new Date(),
  initialEvents = [],
}: {
  children: ReactNode;
  initialDate?: Date;
  initialEvents?: CalendarEvent[];
}) => {
  const { config: calendarConfig } = useCalendarConfig();

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [localEvents, setLocalEvents] = useState<CalendarEvent[]>(initialEvents);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [modalLabel, setModalLabel] = useState("");
  const [modalPatientId, setModalPatientId] = useState("");
  const [modalPatientFirstName, setModalPatientFirstName] = useState("");
  const [modalPatientLastName, setModalPatientLastName] = useState("");
  const [modalPatientDOB, setModalPatientDOB] = useState("");
  const [modalPatientPhone, setModalPatientPhone] = useState("");
  const [modalEventType, setModalEventType] = useState("");
  const [modalSelectedEventType, setModalSelectedEventType] = useState("");
  const [modalConfirmed, setModalConfirmed] = useState(false);
  const [modalLocation, setModalLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [movingEvent, setMovingEvent] = useState<CalendarEvent | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [clickedEvent, setClickedEvent] = useState<CalendarEvent | null>(null);
  const [mouseDownTime, setMouseDownTime] = useState<number | null>(null);
  const [moveOriginalDate, setMoveOriginalDate] = useState<Date | null>(null);
  const [moveStartX, setMoveStartX] = useState<number | null>(null);
  const [moveStartY, setMoveStartY] = useState<number | null>(null);

  const [previewEvent, setPreviewEvent] = useState<CalendarEvent | null>(null);
  const [resizingEvent, setResizingEvent] = useState<CalendarEvent | null>(null);
  const [resizeEdge, setResizeEdge] = useState<"start" | "end" | null>(null);
  const [resizeStartY, setResizeStartY] = useState<number | null>(null);
  const [resizeOriginalStart, setResizeOriginalStart] = useState<Date | null>(null);
  const [resizeOriginalEnd, setResizeOriginalEnd] = useState<Date | null>(null);

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const [tdoAppointments, setTdoAppointments] = useState<any[]>([]);
  const [tdoLoading, setTdoLoading] = useState(false);
  const [tdoError, setTdoError] = useState<string | null>(null);
  const [hasTdoAccess, setHasTdoAccess] = useState<boolean | null>(null);

  const [prefetchEnabled, setPrefetchEnabled] = useState<boolean>(true);

  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragSelectionStart, setDragSelectionStart] = useState<{ day: Date; minutes: number } | null>(null);
  const [dragSelectionEnd, setDragSelectionEnd] = useState<{ day: Date; minutes: number } | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);

  const [movingTdoEventPosition, setMovingTdoEventPosition] = useState<{
    id: string;
    start: Date;
    end?: Date;
    label?: string | null;
  } | null>(null);

  const handlePrev = useCallback(() => {
    if (view === "month") {
      setCurrentDate((prev) => subMonths(prev, 1));
    } else if (view === "week") {
      setCurrentDate((prev) => addDays(prev, -7));
    } else {
      setCurrentDate((prev) => addDays(prev, -1));
    }
  }, [view]);

  const handleNext = useCallback(() => {
    if (view === "month") {
      setCurrentDate((prev) => addMonths(prev, 1));
    } else if (view === "week") {
      setCurrentDate((prev) => addDays(prev, 7));
    } else {
      setCurrentDate((prev) => addDays(prev, 1));
    }
  }, [view]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleAddEvent = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    // UI-only: just close modal
    setShowModal(false);
    // Reset form
    setModalTitle("");
    setModalDescription("");
    setModalLabel("");
    setStartTime("");
    setEndTime("");
  }, []);

  const openEditModal = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setModalDate(event.start);
    setModalTitle(event.title);
    setModalDescription(event.description || "");
    setModalLabel(event.label || "");
    setStartTime(
      `${event.start.getHours().toString().padStart(2, "0")}:${event.start.getMinutes().toString().padStart(2, "0")}`
    );
    if (event.end) {
      setEndTime(
        `${event.end.getHours().toString().padStart(2, "0")}:${event.end.getMinutes().toString().padStart(2, "0")}`
      );
    }
    setModalConfirmed(event.confirmed ?? false);
    setShowEventModal(false);
    setShowModal(true);
  }, []);

  const openEventDetailsModal = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }, []);

  const openEventModal = useCallback((
    date: Date,
    startTimeStr?: string,
    endTimeStr?: string
  ) => {
    setModalDate(date);
    if (startTimeStr) setStartTime(startTimeStr);
    if (endTimeStr) setEndTime(endTimeStr);
    setShowModal(true);
  }, []);

  const openEventModalAtTime = useCallback((
    date: Date,
    yPosition: number,
    containerHeight: number,
    officeHours?: { start: number; end: number },
    zoomLevel?: number
  ) => {
    // Calculate time from y position
    const officeStart = officeHours?.start || 0;
    const hoursFromTop = yPosition / (zoomLevel || 100);
    const totalMinutes = (officeStart * 60) + (hoursFromTop * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    openEventModal(date, timeStr);
  }, [openEventModal]);

  const openModalWithPreset = useCallback((preset: any, startTime: Date) => {
    setModalDate(startTime);
    setModalTitle(preset.name || "");
    setShowModal(true);
  }, []);

  const handleDeleteEvent = useCallback(async (id: string) => {
    setLocalEvents((prev) => prev.filter((e) => e.id !== id));
    setShowEventModal(false);
    setSelectedEvent(null);
  }, []);

  const finalizeEventMove = useCallback(async () => {
    setMovingEvent(null);
    setMoveOriginalDate(null);
    setMoveStartX(null);
    setMoveStartY(null);
    setHasMoved(false);
  }, []);

  const resetEventMove = useCallback(() => {
    setMovingEvent(null);
    setMoveOriginalDate(null);
    setMoveStartX(null);
    setMoveStartY(null);
    setHasMoved(false);
  }, []);

  const finalizeEventResize = useCallback(async () => {
    setResizingEvent(null);
    setResizeEdge(null);
    setResizeStartY(null);
    setResizeOriginalStart(null);
    setResizeOriginalEnd(null);
  }, []);

  const generateRecommendations = useCallback(() => {
    setRecommendationsLoading(true);
    setTimeout(() => {
      setRecommendations([]);
      setRecommendationsLoading(false);
    }, 100);
  }, []);

  const selectRecommendation = useCallback((recommendation: any) => {
    // UI-only: no-op
  }, []);

  const refreshEvents = useCallback(async () => {
    // UI-only: no-op
  }, []);

  const showNotification = useCallback((
    type: "success" | "error" | "loading",
    title: string,
    message: string
  ) => {
    // UI-only: no-op
    console.log(`[${type}] ${title}: ${message}`);
  }, []);

  const value: CalendarState = {
    currentDate,
    setCurrentDate,
    view,
    setView,
    zoomLevel,
    setZoomLevel,
    events: localEvents,
    setEvents: setLocalEvents,
    showModal,
    setShowModal,
    modalDate,
    setModalDate,
    showEventModal,
    setShowEventModal,
    selectedEvent,
    setSelectedEvent,
    editingEvent,
    setEditingEvent,
    handlePrev,
    handleNext,
    handleToday,
    handleAddEvent,
    openEditModal,
    modalTitle,
    setModalTitle,
    modalDescription,
    setModalDescription,
    modalLabel,
    setModalLabel,
    modalPatientId,
    setModalPatientId,
    modalPatientFirstName,
    setModalPatientFirstName,
    modalPatientLastName,
    setModalPatientLastName,
    modalPatientDOB,
    setModalPatientDOB,
    modalPatientPhone,
    setModalPatientPhone,
    modalEventType,
    setModalEventType,
    modalSelectedEventType,
    setModalSelectedEventType,
    modalConfirmed,
    setModalConfirmed,
    modalLocation,
    setModalLocation,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    movingEvent,
    setMovingEvent,
    hasMoved,
    setHasMoved,
    clickedEvent,
    setClickedEvent,
    mouseDownTime,
    setMouseDownTime,
    moveOriginalDate,
    setMoveOriginalDate,
    moveStartX,
    setMoveStartX,
    moveStartY,
    setMoveStartY,
    finalizeEventMove,
    resetEventMove,
    openEventDetailsModal,
    previewEvent,
    setPreviewEvent,
    openModalWithPreset,
    handleDeleteEvent,
    resizingEvent,
    setResizingEvent,
    resizeEdge,
    setResizeEdge,
    resizeStartY,
    setResizeStartY,
    resizeOriginalStart,
    setResizeOriginalStart,
    resizeOriginalEnd,
    setResizeOriginalEnd,
    finalizeEventResize,
    openEventModal,
    openEventModalAtTime,
    recommendations,
    setRecommendations,
    recommendationsLoading,
    setRecommendationsLoading,
    generateRecommendations,
    selectRecommendation,
    refreshEvents,
    showNotification,
    tdoAppointments,
    tdoLoading,
    tdoError,
    hasTdoAccess,
    prefetchEnabled,
    setPrefetchEnabled,
    isDraggingSelection,
    setIsDraggingSelection,
    dragSelectionStart,
    setDragSelectionStart,
    dragSelectionEnd,
    setDragSelectionEnd,
    dragStartPosition,
    setDragStartPosition,
    movingTdoEventPosition,
    setMovingTdoEventPosition,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};

