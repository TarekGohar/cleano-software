"use client";

import React, { useEffect, useRef } from "react";
import { useCalendar } from "@/components/calendar/CalendarContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Badge from "@/components/ui/Badge";
import { format, getEventColors } from "@/components/calendar/utils";
import { useCalendarConfig } from "@/contexts/CalendarConfigContext";
import { EventTypesConfig, RoomConfig } from "@/types/calendar";
import { CalendarEvent } from "@/components/calendar/types";
// import { BsFillTelephoneForwardFill } from "react-icons/bs";
import {
  Clock,
  Edit3,
  Trash2,
  CheckCircle,
  ChevronDown,
  X,
  Loader,
  Phone,
} from "lucide-react";
import { validateRoomEventTypeCompatibility } from "@/lib/calendar-event-types";
import AppointmentRecommendations from "@/components/calendar/AppointmentRecommendations";
import { ConfirmDeleteModal } from "@/components/common/ConfirmDeleteModal";
import { ConfirmActionModal } from "@/components/common/ConfirmActionModal";
import CustomDropdown from "@/components/ui/custom-dropdown";
import Textarea from "@/components/ui/Textarea";
import Card from "../ui/Card";

export const EventModals = () => {
  const dobInputRef = useRef<HTMLInputElement>(null);

  const {
    showModal,
    setShowModal,
    modalDate,
    setModalDate,
    handleAddEvent,
    modalTitle,
    setModalTitle,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    modalDescription,
    setModalDescription,
    modalLabel,
    setModalLabel,
    modalSelectedEventType,
    setModalSelectedEventType,
    modalPatientFirstName,
    setModalPatientFirstName,
    modalPatientLastName,
    setModalPatientLastName,
    modalPatientDOB,
    setModalPatientDOB,
    modalPatientPhone,
    setModalPatientPhone,
    modalConfirmed,
    setModalConfirmed,
    showEventModal,
    setShowEventModal,
    events,
    setEvents,
    selectedEvent,
    setSelectedEvent,
    handleDeleteEvent,
    openEditModal,
    editingEvent,
    recommendations,
    recommendationsLoading,
    generateRecommendations,
    selectRecommendation,
    refreshEvents,
  } = useCalendar();

  const { config: calendarConfig } = useCalendarConfig();
  const isJobEvent = !!selectedEvent?.metadata?.jobId;

  // Parse event types from calendar config
  const eventTypes: EventTypesConfig =
    (calendarConfig?.eventTypes as unknown as EventTypesConfig) || {};

  // Prepare event type options for dropdown
  const eventTypeOptions = [
    { value: "", label: "None" },
    { value: "block", label: "Block", color: "#6B7280" },
    ...Object.entries(eventTypes).map(([key, eventType]) => ({
      value: key,
      label: eventType.name,
      color: eventType.color,
    })),
  ];

  const timeFormatOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: !calendarConfig?.use24HourClock,
  };

  const formatDateTime = (date?: Date) => {
    if (!date) return "—";
    return date.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Validation state for time slots and patient info
  const [timeSlotError, setTimeSlotError] = React.useState<string>("");
  const [scheduleConflictError, setScheduleConflictError] =
    React.useState<string>("");
  const [patientValidationError, setPatientValidationError] =
    React.useState<string>("");
  const [roomValidationError, setRoomValidationError] =
    React.useState<string>("");
  const [dayOfWeekError, setDayOfWeekError] = React.useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = React.useState<boolean>(false);
  const [showConflictModal, setShowConflictModal] =
    React.useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);

  // Get available rooms for the selected event type
  const getAvailableRooms = () => {
    if (!calendarConfig?.labels) {
      return [];
    }

    // Always return all rooms - don't filter based on event type
    // The validation will handle compatibility warnings
    return calendarConfig.labels.map((label) => ({
      name: label.name,
      labelConfig: label.labelConfig as RoomConfig,
    }));
  };

  // Validate room and event type compatibility
  const validateRoomCompatibility = () => {
    setRoomValidationError("");

    // Skip validation for block events - blocks can be placed in any room
    if (modalSelectedEventType === "block") {
      return;
    }

    if (!modalLabel || !modalSelectedEventType || !calendarConfig?.labels) {
      return;
    }

    const rooms = calendarConfig.labels.map((label) => ({
      name: label.name,
      labelConfig: label.labelConfig as RoomConfig,
    }));

    const validation = validateRoomEventTypeCompatibility(
      modalLabel,
      modalSelectedEventType,
      rooms
    );

    if (!validation.isValid) {
      setRoomValidationError(
        validation.message || "Room/event type incompatibility"
      );
    }
  };

  // Validate room compatibility when room or event type changes
  React.useEffect(() => {
    validateRoomCompatibility();
  }, [modalLabel, modalSelectedEventType]);

  // Clear room selection if it becomes invalid due to event type change
  React.useEffect(() => {
    if (modalSelectedEventType && modalLabel) {
      const availableRooms = getAvailableRooms();
      const isRoomStillAvailable = availableRooms.some(
        (room) => room.name === modalLabel
      );

      if (!isRoomStillAvailable) {
        setModalLabel("");
        setRoomValidationError(
          "Selected room is not available for this event type"
        );
      }
    }
  }, [modalSelectedEventType]);

  // Helper function to convert time string to minutes for comparison
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr || !timeStr.includes(":")) {
      return 0;
    }

    const [hours, minutes] = timeStr.split(":").map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      return 0;
    }

    return hours * 60 + minutes;
  };

  // Helper function to check if a time range is within allowed slots
  const isTimeRangeAllowed = (
    startTimeStr: string,
    endTimeStr: string,
    allowedSlots: any[]
  ): boolean => {
    if (!allowedSlots || allowedSlots.length === 0) return true;

    const startMinutes = timeToMinutes(startTimeStr);
    const endMinutes = timeToMinutes(endTimeStr);

    return allowedSlots.some((slot) => {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      return startMinutes >= slotStart && endMinutes <= slotEnd;
    });
  };

  // Helper function to check for schedule conflicts with existing events
  const checkScheduleConflict = (
    date: Date,
    startTimeStr: string,
    endTimeStr: string,
    roomName: string
  ): string | null => {
    if (!date || !startTimeStr || !endTimeStr || !roomName) {
      return null;
    }

    const proposalStart = new Date(date);
    const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
    proposalStart.setHours(startHours, startMinutes, 0, 0);

    const proposalEnd = new Date(date);
    const [endHours, endMinutes] = endTimeStr.split(":").map(Number);
    proposalEnd.setHours(endHours, endMinutes, 0, 0);

    const conflictingEvent = events.find((event: CalendarEvent) => {
      // Skip the event we're currently editing
      if (editingEvent && event.id === editingEvent.id) {
        return false;
      }

      // Only check events in the same room
      if (event.label !== roomName) {
        return false;
      }

      // Check if events are on the same date
      const eventDate = new Date(event.start).toISOString().split("T")[0];
      const proposalDate = date.toISOString().split("T")[0];
      if (eventDate !== proposalDate) {
        return false;
      }

      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end || event.start);

      // Check for overlap: events overlap if start1 < end2 && start2 < end1
      return proposalStart < eventEnd && proposalEnd > eventStart;
    });

    if (conflictingEvent) {
      const conflictStart = new Date(conflictingEvent.start).toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }
      );
      const conflictEnd = new Date(
        conflictingEvent.end || conflictingEvent.start
      ).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      return `Conflicts with "${conflictingEvent.title}" scheduled ${conflictStart}-${conflictEnd} in room ${roomName}`;
    }

    return null;
  };

  // Auto-populate fields when event type is selected
  useEffect(() => {
    if (modalSelectedEventType === "block") {
      // Handle block events
      if (!modalTitle || modalTitle === "Block") {
        setModalTitle("Block");
      }
      // For blocks, we'll let users set their own duration
    } else if (modalSelectedEventType && eventTypes[modalSelectedEventType]) {
      const selectedType = eventTypes[modalSelectedEventType];

      // Auto-populate title if not already set or if it was previously auto-populated
      if (!modalTitle || modalTitle === selectedType.defaultTitle) {
        setModalTitle(selectedType.defaultTitle || selectedType.name);
      }

      // Calculate end time based on duration (only for event types with predefined duration)
      if (startTime && startTime.includes(":") && selectedType.durationMins) {
        try {
          const [hours, minutes] = startTime.split(":").map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + selectedType.durationMins;
            const endHours = Math.floor(endMinutes / 60);
            const endMins = endMinutes % 60;
            setEndTime(
              `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`
            );
          }
        } catch (error) {
          console.error("Error calculating end time:", error);
        }
      }
    }
  }, [modalSelectedEventType, eventTypes, startTime, modalTitle]);

  // Validate time slots when start time, end time, or event type changes
  useEffect(() => {
    if (
      modalSelectedEventType &&
      eventTypes[modalSelectedEventType] &&
      startTime &&
      endTime
    ) {
      const selectedType = eventTypes[modalSelectedEventType];
      const isAllowed = isTimeRangeAllowed(
        startTime,
        endTime,
        selectedType.allowedTimeSlots
      );

      if (!isAllowed) {
        const allowedSlotsText = selectedType.allowedTimeSlots
          .map((slot) => `${slot.startTime}-${slot.endTime}`)
          .join(", ");
        setTimeSlotError(
          `This event type is only allowed during: ${allowedSlotsText}`
        );
      } else {
        setTimeSlotError("");
      }
    } else {
      setTimeSlotError("");
    }
  }, [modalSelectedEventType, eventTypes, startTime, endTime]);

  // Validate day of week when date or event type changes
  useEffect(() => {
    if (
      modalSelectedEventType &&
      eventTypes[modalSelectedEventType] &&
      modalDate
    ) {
      const selectedType = eventTypes[modalSelectedEventType];
      const dayOfWeek = modalDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      if (
        selectedType.allowedDaysOfWeek &&
        selectedType.allowedDaysOfWeek.length > 0
      ) {
        const isDayAllowed = selectedType.allowedDaysOfWeek.includes(dayOfWeek);

        if (!isDayAllowed) {
          const allowedDayNames = selectedType.allowedDaysOfWeek
            .map(
              (day) =>
                [
                  "Sunday",
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                ][day]
            )
            .join(", ");
          setDayOfWeekError(
            `This event type is only allowed on: ${allowedDayNames}`
          );
        } else {
          setDayOfWeekError("");
        }
      } else {
        setDayOfWeekError("");
      }
    } else {
      setDayOfWeekError("");
    }
  }, [modalSelectedEventType, eventTypes, modalDate]);

  // Check for schedule conflicts when date, time, or room changes
  useEffect(() => {
    if (modalDate && startTime && endTime && modalLabel && modalLabel.trim()) {
      const conflictError = checkScheduleConflict(
        modalDate,
        startTime,
        endTime,
        modalLabel
      );
      setScheduleConflictError(conflictError || "");
    } else {
      setScheduleConflictError("");
    }
  }, [modalDate, startTime, endTime, modalLabel, events, editingEvent]);

  // Check if this is a block event
  const isBlockEvent = modalSelectedEventType === "block";

  // Check if we're editing a TDO appointment
  const isEditingTdoAppointment = editingEvent?.metadata?.isTdoAppointment;

  // Auto-generate title based on patient name and event type
  useEffect(() => {
    // Only auto-generate for non-block events
    if (!isBlockEvent) {
      const firstName = modalPatientFirstName.trim();
      const lastName = modalPatientLastName.trim();
      const eventTypeName =
        modalSelectedEventType && eventTypes[modalSelectedEventType]
          ? eventTypes[modalSelectedEventType].name
          : modalSelectedEventType;

      // Generate title if we have patient name and/or event type
      if (firstName || lastName || eventTypeName) {
        let patientName = "";
        if (firstName && lastName) {
          patientName = `${firstName} ${lastName}`;
        } else if (firstName) {
          patientName = firstName;
        } else if (lastName) {
          patientName = lastName;
        }

        let newTitle = "";
        if (patientName && eventTypeName) {
          newTitle = `${patientName} - ${eventTypeName}`;
        } else if (patientName) {
          newTitle = patientName;
        } else if (eventTypeName) {
          newTitle = eventTypeName;
        }

        if (newTitle && newTitle !== modalTitle) {
          setModalTitle(newTitle);
        }
      }
    }
  }, [
    modalPatientFirstName,
    modalPatientLastName,
    modalSelectedEventType,
    eventTypes,
    isBlockEvent,
    modalTitle,
  ]);

  // Generate recommendations when event type or date changes
  useEffect(() => {
    if (modalSelectedEventType && modalSelectedEventType !== "block") {
      // Use a timeout to debounce the call and avoid rapid re-renders
      const timeoutId = setTimeout(() => {
        generateRecommendations();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [modalSelectedEventType, modalDate]);

  // Validate patient information on submit (only for non-block events)
  // Reset validation errors when modal opens
  React.useEffect(() => {
    if (showModal) {
      setPatientValidationError("");
      setScheduleConflictError("");
      setTimeSlotError("");
      setDayOfWeekError("");
      setRoomValidationError("");
      // If not editing an existing event, ensure DOB is truly empty
      if (!editingEvent) {
        setModalPatientDOB("");
        // Also directly clear the DOM input to override browser defaults
        if (dobInputRef.current) {
          dobInputRef.current.value = "";
        }
      }
    }
  }, [showModal, editingEvent]);

  const validatePatientFields = () => {
    // Skip validation for block events and TDO appointments
    if (isBlockEvent || isEditingTdoAppointment) {
      return true;
    }

    const hasFirstName = modalPatientFirstName.trim() !== "";
    const hasLastName = modalPatientLastName.trim() !== "";
    const hasDOB = modalPatientDOB.trim() !== "";
    const hasPhone = modalPatientPhone.trim() !== "";

    if (!hasFirstName || !hasLastName || !hasDOB || !hasPhone) {
      setPatientValidationError("All patient fields are required");
      return false;
    } else {
      setPatientValidationError("");
      return true;
    }
  };

  // Custom form submit handler with validation
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for hard validation errors (not conflicts) before submitting
    if (timeSlotError || dayOfWeekError || roomValidationError) {
      // Focus on the first error field to help user fix it
      if (dayOfWeekError || timeSlotError) {
        // Focus on date/time inputs
        const dateInput = document.querySelector(
          'input[type="date"]'
        ) as HTMLInputElement;
        if (dateInput) dateInput.focus();
      }
      return;
    }

    // Validate patient fields before submitting
    if (!validatePatientFields()) {
      return;
    }

    // If there's a schedule conflict, show confirmation modal
    if (scheduleConflictError) {
      setShowConflictModal(true);
      return;
    }

    // No conflicts, proceed with submission
    await submitEvent();
  };

  // Actual submission logic
  const submitEvent = async () => {
    setIsSubmitting(true);
    // Create a synthetic event for handleAddEvent
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleAddEvent(syntheticEvent);
    setIsSubmitting(false);
  };

  // Handle confirmation of conflict override
  const handleConflictConfirm = async () => {
    setShowConflictModal(false);
    await submitEvent();
  };

  // Handle confirmation toggle for existing events
  const handleConfirmationToggle = async () => {
    if (!selectedEvent) return;

    const isTdoAppointment = !!selectedEvent.metadata?.isTdoAppointment;

    try {
      const response = await fetch(`/api/events/${selectedEvent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmed: !selectedEvent.confirmed,
        }),
      });

      if (response.ok) {
        const updatedEventData = await response.json();

        // Handle TDO appointments differently - they return a simpler response
        if (isTdoAppointment) {
          // For TDO appointments, just update the confirmed status locally
          const updatedEvent = {
            ...selectedEvent,
            confirmed: !selectedEvent.confirmed,
          };

          // Update the event in the local state
          setSelectedEvent(updatedEvent);
          // Also update the events list
          const updatedEvents = events.map((event) =>
            event.id === selectedEvent.id ? updatedEvent : event
          );
          setEvents(updatedEvents);

          // Refresh calendar data to get the updated TDO appointment
          if (refreshEvents) {
            refreshEvents();
          }
        } else {
          // Handle local events with full response data
          // Convert date strings back to Date objects
          const updatedEvent = {
            ...updatedEventData,
            start: new Date(updatedEventData.start),
            end: updatedEventData.end
              ? new Date(updatedEventData.end)
              : undefined,
            createdAt: updatedEventData.createdAt
              ? new Date(updatedEventData.createdAt)
              : undefined,
            updatedAt: updatedEventData.updatedAt
              ? new Date(updatedEventData.updatedAt)
              : undefined,
          };

          // Update the event in the local state
          setSelectedEvent(updatedEvent);
          // Also update the events list
          const updatedEvents = events.map((event) =>
            event.id === selectedEvent.id ? updatedEvent : event
          );
          setEvents(updatedEvents);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "Failed to update event confirmation status:",
          errorData.error || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error updating event confirmation status:", error);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (selectedEvent) {
      await handleDeleteEvent(selectedEvent.id);
      setShowDeleteModal(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setModalSelectedEventType("");
  };

  // Hard validation errors that block submission
  const hasValidationErrors =
    !!timeSlotError ||
    !!dayOfWeekError ||
    !!roomValidationError ||
    (!isBlockEvent && !isEditingTdoAppointment && !!patientValidationError);

  // Conflict is a soft error - user can override with confirmation
  const hasConflictWarning = !!scheduleConflictError;

  return (
    <>
      {/* Add/Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(2px)",
              backgroundColor: "rgba(175, 175, 175, 0.1)",
            }}
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="relative z-[1001] w-full max-w-4xl max-h-[95vh] bg-white rounded-3xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#005F6A]/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="h2-title">
                    {isEditingTdoAppointment
                      ? "Edit TDO Appointment"
                      : editingEvent
                        ? "Edit Appointment"
                        : "New Appointment"}
                  </h1>
                  <p className="h2-subheader">
                    {isEditingTdoAppointment
                      ? "Update the date, time, or notes for this TDO appointment"
                      : editingEvent
                        ? "Update the appointment details below"
                        : "Fill in the details to schedule a new appointment"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={handleClose}
                  className="!p-2 -mt-1 -mr-1">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleFormSubmit}
              className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Event Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#005F6A]">
                      <h3 className="section-title">
                        {isEditingTdoAppointment
                          ? "Appointment Info"
                          : "Event Details"}
                      </h3>
                    </div>

                    {/* TDO Appointment Info (Read-only) */}
                    {isEditingTdoAppointment && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4 space-y-2">
                        <p className="app-title">{editingEvent?.title}</p>
                        {editingEvent?.metadata?.tdoAppointmentFor && (
                          <p className="app-subtitle">
                            {editingEvent.metadata.tdoAppointmentFor}
                          </p>
                        )}
                        {editingEvent?.metadata?.tdoDoctorName && (
                          <p className="app-subtitle !text-[#005F6A]/60">
                            Doctor: {editingEvent.metadata.tdoDoctorName}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Event Type - Hidden for TDO appointments */}
                      {!isEditingTdoAppointment && (
                        <div>
                          <label className="input-label">Event Type</label>
                          <CustomDropdown
                            trigger={
                              <div className="relative w-full">
                                <Input
                                  variant="form"
                                  size="md"
                                  value={
                                    eventTypeOptions.find(
                                      (opt) =>
                                        opt.value === modalSelectedEventType
                                    )?.label || ""
                                  }
                                  readOnly
                                  className="w-full px-4 py-3 cursor-pointer pr-10"
                                  placeholder="Select event type (optional)"
                                  border={false}
                                />
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#005F6A]/50 pointer-events-none" />
                              </div>
                            }
                            options={eventTypeOptions.map((opt) => ({
                              label: opt.label,
                              onClick: () =>
                                setModalSelectedEventType(String(opt.value)),
                            }))}
                            className="w-full"
                            maxHeight="14rem"
                            align="left"
                            position="bottom"
                          />
                        </div>
                      )}

                      {/* Date */}
                      <div
                        className={isEditingTdoAppointment ? "col-span-2" : ""}>
                        <label className="input-label">
                          Date <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <Input
                          variant="form"
                          size="md"
                          type="date"
                          value={
                            modalDate
                              ? modalDate.toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) => {
                            if (e.target.value) {
                              const [year, month, day] = e.target.value
                                .split("-")
                                .map(Number);
                              const localDate = new Date(year, month - 1, day);
                              setModalDate(localDate);
                            }
                          }}
                          className="w-full px-4 py-3"
                          border={false}
                          error={!!dayOfWeekError}
                          required
                        />
                      </div>
                    </div>

                    {/* Suggested Times - Hidden for TDO appointments */}
                    {!isBlockEvent &&
                      !isEditingTdoAppointment &&
                      modalSelectedEventType && (
                        <div className="space-y-2">
                          <label className="input-label">Suggested Times</label>
                          <AppointmentRecommendations
                            recommendations={recommendations}
                            onSelect={selectRecommendation}
                            isLoading={recommendationsLoading}
                            targetDate={modalDate}
                          />
                        </div>
                      )}
                  </div>

                  {/* Patient Information - Only for non-block events and non-TDO appointments */}
                  {!isBlockEvent && !isEditingTdoAppointment && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[#005F6A]">
                        <h3 className="section-title">Patient Information</h3>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="input-label">
                            First Name{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <Input
                            variant="form"
                            size="md"
                            placeholder="First name"
                            value={modalPatientFirstName}
                            onChange={(e) =>
                              setModalPatientFirstName(e.target.value)
                            }
                            className="w-full px-4 py-3"
                            border={false}
                            required
                          />
                        </div>
                        <div>
                          <label className="input-label">
                            Last Name{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <Input
                            variant="form"
                            size="md"
                            placeholder="Last name"
                            value={modalPatientLastName}
                            onChange={(e) =>
                              setModalPatientLastName(e.target.value)
                            }
                            className="w-full px-4 py-3"
                            border={false}
                            required
                          />
                        </div>
                        <div>
                          <label className="input-label">
                            Date of Birth{" "}
                            <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <Input
                            ref={dobInputRef}
                            key={`dob-text-${editingEvent?.id || "new"}`}
                            variant="form"
                            size="md"
                            type="text"
                            value={modalPatientDOB}
                            onChange={(e) => {
                              let value = e.target.value.replace(/[^\d]/g, "");
                              if (value.length >= 4) {
                                value =
                                  value.slice(0, 4) + "-" + value.slice(4);
                              }
                              if (value.length >= 7) {
                                value =
                                  value.slice(0, 7) + "-" + value.slice(7, 9);
                              }
                              if (value.length > 10) {
                                value = value.slice(0, 10);
                              }
                              setModalPatientDOB(value);
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              if (value.length === 10) {
                                const testDate = new Date(value);
                                const isValidDate = testDate
                                  .toISOString()
                                  .startsWith(value);
                                if (!isValidDate) {
                                  alert(
                                    "Please enter a valid date in YYYY-MM-DD format"
                                  );
                                  e.target.focus();
                                }
                              }
                            }}
                            placeholder="YYYY-MM-DD"
                            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                            maxLength={10}
                            autoComplete="off"
                            className="w-full px-4 py-3"
                            border={false}
                            required
                          />
                        </div>
                        <div>
                          <label className="input-label">
                            Phone <span className="text-red-500 ml-0.5">*</span>
                          </label>
                          <Input
                            variant="form"
                            size="md"
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={modalPatientPhone}
                            onChange={(e) =>
                              setModalPatientPhone(e.target.value)
                            }
                            className="w-full px-4 py-3"
                            border={false}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Scheduling Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#005F6A]">
                      <h3 className="section-title">Scheduling</h3>
                    </div>

                    <div
                      className={`grid gap-4 ${isEditingTdoAppointment ? "grid-cols-2" : "grid-cols-3"}`}>
                      <div>
                        <label className="input-label">
                          Start Time{" "}
                          <span className="text-red-500 ml-0.5">*</span>
                        </label>
                        <Input
                          variant="form"
                          size="md"
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-4 py-3"
                          border={false}
                          error={!!timeSlotError || !!scheduleConflictError}
                        />
                      </div>
                      <div>
                        <label className="input-label">
                          End Time{" "}
                          <span className="text-red-500 ml-0.5">*</span>
                          {!isEditingTdoAppointment &&
                            modalSelectedEventType &&
                            modalSelectedEventType !== "block" && (
                              <span className="text-xs text-[#005F6A]/50 font-normal ml-1">
                                (Auto)
                              </span>
                            )}
                        </label>
                        <Input
                          variant="form"
                          size="md"
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          disabled={
                            !isEditingTdoAppointment &&
                            !!modalSelectedEventType &&
                            modalSelectedEventType !== "block"
                          }
                          className={`w-full px-4 py-3 ${!isEditingTdoAppointment && modalSelectedEventType && modalSelectedEventType !== "block" ? "opacity-60 cursor-not-allowed" : ""}`}
                          border={false}
                          error={!!timeSlotError || !!scheduleConflictError}
                        />
                      </div>
                      {/* Room - Hidden for TDO appointments (requires operatory ID lookup) */}
                      {!isEditingTdoAppointment && (
                        <div>
                          <label className="input-label">Room</label>
                          <CustomDropdown
                            trigger={
                              <div className="relative w-full">
                                <Input
                                  variant="form"
                                  size="md"
                                  value={modalLabel || ""}
                                  readOnly
                                  className="w-full px-4 py-3 cursor-pointer pr-10"
                                  placeholder="Select room..."
                                  border={false}
                                />
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#005F6A]/50 pointer-events-none" />
                              </div>
                            }
                            options={[
                              {
                                label: "Select room...",
                                onClick: () => setModalLabel(""),
                              },
                              ...getAvailableRooms().map((room) => ({
                                label: room.name,
                                onClick: () => setModalLabel(room.name),
                              })),
                            ]}
                            className="w-full"
                            maxHeight="14rem"
                            align="left"
                            position="bottom"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Notes Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#005F6A]">
                      <h3 className="section-title">Additional Notes</h3>
                    </div>

                    <div>
                      <label className="input-label">Description</label>
                      <Textarea
                        variant="form"
                        placeholder="Enter any additional notes or description..."
                        value={modalDescription}
                        onChange={(e) => setModalDescription(e.target.value)}
                        className="w-full px-4 py-3 min-h-[80px]"
                      />
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="flex items-center gap-3">
                      <label className="flex !items-center gap-3 cursor-pointer">
                        <Checkbox
                          color="alara"
                          checked={modalConfirmed}
                          onChange={(e) => setModalConfirmed(e.target.checked)}
                        />
                        <span className="input-label !mb-0">
                          Mark as confirmed
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[#005F6A]/10 flex justify-between items-center gap-4">
                {/* Validation Errors & Warnings - Left Side */}
                <div className="flex items-center gap-2 flex-1 overflow-x-auto">
                  {(hasValidationErrors || hasConflictWarning) && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {roomValidationError && (
                        <div className="bg-red-50 rounded-xl px-3 py-1.5 flex-shrink-0">
                          <p className="text-xs text-red-600 whitespace-nowrap">
                            Room: {roomValidationError}
                          </p>
                        </div>
                      )}
                      {timeSlotError && (
                        <div className="bg-red-50 rounded-xl px-3 py-1.5 flex-shrink-0">
                          <p className="text-xs text-red-600 whitespace-nowrap">
                            Time: {timeSlotError}
                          </p>
                        </div>
                      )}
                      {dayOfWeekError && (
                        <div className="bg-red-50 rounded-xl px-3 py-1.5 flex-shrink-0">
                          <p className="text-xs text-red-600 whitespace-nowrap">
                            Day: {dayOfWeekError}
                          </p>
                        </div>
                      )}
                      {scheduleConflictError && (
                        <div className="bg-amber-50 rounded-xl px-3 py-1.5 flex-shrink-0">
                          <p className="text-xs text-amber-600 whitespace-nowrap max-w-[300px] truncate">
                            Warning: {scheduleConflictError}
                          </p>
                        </div>
                      )}
                      {patientValidationError && (
                        <div className="bg-red-50 rounded-xl px-3 py-1.5 flex-shrink-0">
                          <p className="text-xs text-red-600 whitespace-nowrap">
                            Patient: {patientValidationError}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons - Right Side */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Button
                    type="button"
                    variant="default"
                    size="md"
                    border={false}
                    onClick={handleClose}
                    className="px-6 py-3">
                    Cancel
                  </Button>
                  <Button
                    variant="action"
                    size="md"
                    type="submit"
                    disabled={hasValidationErrors || isSubmitting}
                    className="px-6 py-3">
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        {editingEvent ? "Updating..." : "Creating..."}
                      </>
                    ) : editingEvent ? (
                      isEditingTdoAppointment ? (
                        "Update TDO Appointment"
                      ) : isBlockEvent ? (
                        "Update Block"
                      ) : (
                        "Update Appointment"
                      )
                    ) : isBlockEvent ? (
                      "Add Block"
                    ) : (
                      "Add Appointment"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Job Event Details Modal (styled like JobModal) */}
      {showEventModal && selectedEvent && isJobEvent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(2px)",
              backgroundColor: "rgba(175, 175, 175, 0.1)",
            }}
            onClick={() => {
              setShowEventModal(false);
              setSelectedEvent(null);
            }}
          />

          <div className="relative z-[1001] w-full max-w-2xl max-h-[95vh] bg-white rounded-3xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#005F6A]/10 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <h1 className="text-2xl font-[350] tracking-tight text-[#005F6A] truncate">
                  {selectedEvent.title || "Job"}
                </h1>
                <div className="flex flex-wrap gap-2">
                  <Badge size="md" variant="primary">
                    Cleaning Job
                  </Badge>
                  {selectedEvent.metadata?.status && (
                    <Badge size="md" variant="secondary">
                      {selectedEvent.metadata.status.replace("_", " ")}
                    </Badge>
                  )}
                  {selectedEvent.metadata?.jobType && (
                    <Badge size="md" variant="default">
                      {selectedEvent.metadata.jobType}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}
                className="!p-2 -mt-1 -mr-1">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card variant="ghost" className="!p-4 space-y-2">
                  <p className="text-xs font-[500] text-[#005F6A]/60 uppercase">
                    Client
                  </p>
                  <p className="text-sm text-[#005F6A] font-[400]">
                    {selectedEvent.metadata?.clientName || "Not provided"}
                  </p>
                  <p className="text-xs text-[#005F6A]/60">
                    {selectedEvent.metadata?.clientPhone || ""}
                  </p>
                </Card>

                <Card variant="ghost" className="!p-4 space-y-2">
                  <p className="text-xs font-[500] text-[#005F6A]/60 uppercase">
                    Location
                  </p>
                  <p className="text-sm text-[#005F6A] font-[400]">
                    {selectedEvent.metadata?.location ||
                      selectedEvent.metadata?.jobLocation ||
                      "Not provided"}
                  </p>
                </Card>
              </div>

              <Card variant="ghost" className="!p-4 space-y-3">
                <p className="text-xs font-[500] text-[#005F6A]/60 uppercase">
                  Schedule
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#005F6A]/70 mt-[2px]" />
                    <div>
                      <p className="text-xs text-[#005F6A]/60">Start</p>
                      <p className="text-sm text-[#005F6A] font-[400]">
                        {formatDateTime(selectedEvent.start)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#005F6A]/70 mt-[2px]" />
                    <div>
                      <p className="text-xs text-[#005F6A]/60">End</p>
                      <p className="text-sm text-[#005F6A] font-[400]">
                        {formatDateTime(selectedEvent.end)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card variant="ghost" className="!p-4 space-y-2">
                <p className="text-xs font-[500] text-[#005F6A]/60 uppercase">
                  Details
                </p>
                <p className="text-sm text-[#005F6A] whitespace-pre-wrap">
                  {selectedEvent.description || "No additional details"}
                </p>
              </Card>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#005F6A]/10 flex flex-col sm:flex-row justify-between gap-3">
              <Button
                variant="primary"
                size="md"
                className="!px-6 !py-3"
                onClick={() => {
                  window.location.href = `/jobs/${selectedEvent.metadata?.jobId}`;
                }}>
                View Full Job Details
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="!px-6 !py-3"
                onClick={() => {
                  setShowEventModal(false);
                  setSelectedEvent(null);
                }}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && !isJobEvent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Blurred backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(2px)",
              backgroundColor: "rgba(175, 175, 175, 0.1)",
            }}
            onClick={() => {
              setShowEventModal(false);
              setSelectedEvent(null);
            }}
          />

          {/* Modal Container */}
          <div className="relative z-[1001] w-full max-w-2xl max-h-[95vh] bg-white rounded-3xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#005F6A]/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="h2-title">{selectedEvent.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {selectedEvent.metadata?.jobId && (
                      <Badge size="md" variant="primary">
                        Cleaning Job
                      </Badge>
                    )}
                    {selectedEvent.metadata?.isTdoAppointment && (
                      <Badge size="md" variant="tdo">
                        TDO Appointment
                      </Badge>
                    )}
                    {!selectedEvent.metadata?.jobId && (
                      <>
                        {selectedEvent.confirmed ? (
                          <Badge size="md" variant="success">
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge size="md" variant="default">
                            Pending Confirmation
                          </Badge>
                        )}
                      </>
                    )}
                    {selectedEvent.label && (
                      <Badge size="md" variant="secondary">
                        {selectedEvent.label}
                      </Badge>
                    )}
                    {selectedEvent.metadata?.selectedEventType &&
                      (() => {
                        const { eventBgColor, borderStyle } = getEventColors(
                          selectedEvent,
                          calendarConfig,
                          0.2
                        );
                        return (
                          <Badge
                            size="md"
                            style={{
                              backgroundColor: eventBgColor,
                              borderColor: borderStyle,
                            }}
                            variant="secondary">
                            {eventTypes[
                              selectedEvent.metadata.selectedEventType
                            ]?.name || selectedEvent.metadata.selectedEventType}
                          </Badge>
                        );
                      })()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                  }}
                  className="!p-2 -mt-1 -mr-1">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Date & Time */}
              <div className="space-y-3">
                <h3 className="section-title">Date & Time</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                    <p className="app-title-small !text-[#005F6A]/60 mb-1">
                      Date
                    </p>
                    <p className="app-title">
                      {format(selectedEvent.start, "EEEE, d MMMM yyyy")}
                    </p>
                  </div>
                  <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                    <p className="app-title-small !text-[#005F6A]/60 mb-1">
                      Time
                    </p>
                    <p className="app-title">
                      {selectedEvent.start.toLocaleTimeString(
                        [],
                        timeFormatOptions
                      )}
                      {selectedEvent.end &&
                        ` - ${selectedEvent.end.toLocaleTimeString([], timeFormatOptions)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              {(selectedEvent.metadata?.patientFirstName ||
                selectedEvent.metadata?.patientLastName ||
                selectedEvent.metadata?.patientPhone ||
                selectedEvent.metadata?.patientDOB) && (
                <div className="space-y-3">
                  <h3 className="section-title">Patient Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    {(selectedEvent.metadata?.patientFirstName ||
                      selectedEvent.metadata?.patientLastName) && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <p className="app-title-small !mb-1 !text-[#005F6A]/60">
                          Patient Name
                        </p>
                        <p className="app-title">
                          {[
                            selectedEvent.metadata?.patientFirstName,
                            selectedEvent.metadata?.patientLastName,
                          ]
                            .filter(Boolean)
                            .join(" ") || "Not provided"}
                        </p>
                      </div>
                    )}
                    {selectedEvent.metadata?.patientPhone && (
                      <a
                        href={`tel:${selectedEvent.metadata.patientPhone}`}
                        className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <div className="flex items-center !justify-between gap-1">
                          <p className="app-title-small !mb-1 !text-[#005F6A]/60">
                            Phone Number
                          </p>
                          <Phone className="w-3 h-3 text-[#005F6A]" />
                        </div>
                        <p className="app-title !flex !items-center gap-1">
                          {selectedEvent.metadata.patientPhone}
                        </p>
                      </a>
                    )}
                    {selectedEvent.metadata?.patientDOB && (
                      <Card variant="default" className="!p-4">
                        <p className="app-title-small !mb-1 !text-[#005F6A]/60">
                          Date of Birth
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.patientDOB
                            ? new Date(
                                selectedEvent.metadata.patientDOB
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Not provided"}
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              )}

              {/* Job-Specific Information */}
              {selectedEvent.metadata?.jobId && (
                <div className="space-y-3">
                  <h3 className="section-title">Job Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEvent.metadata?.status && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <p className="app-title-small !text-[#005F6A]/60 mb-1">
                          Status
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.status.replace("_", " ")}
                        </p>
                      </div>
                    )}
                    {selectedEvent.metadata?.jobType && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <p className="app-title-small !text-[#005F6A]/60 mb-1">
                          Job Type
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.jobType}
                        </p>
                      </div>
                    )}
                    {selectedEvent.metadata?.location && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4 col-span-2">
                        <p className="app-title-small !text-[#005F6A]/60 mb-1">
                          Location
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.location}
                        </p>
                      </div>
                    )}
                    {selectedEvent.metadata?.price !== undefined &&
                      selectedEvent.metadata?.price !== null && (
                        <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                          <p className="app-title-small !text-[#005F6A]/60 mb-1">
                            Price
                          </p>
                          <p className="app-title">
                            ${selectedEvent.metadata.price.toFixed(2)}
                          </p>
                        </div>
                      )}
                    {selectedEvent.metadata?.employeePay !== undefined &&
                      selectedEvent.metadata?.employeePay !== null && (
                        <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                          <p className="app-title-small !text-[#005F6A]/60 mb-1">
                            Employee Pay
                          </p>
                          <p className="app-title">
                            ${selectedEvent.metadata.employeePay.toFixed(2)}
                          </p>
                        </div>
                      )}
                    {selectedEvent.metadata?.totalTip !== undefined &&
                      selectedEvent.metadata?.totalTip !== null &&
                      selectedEvent.metadata?.totalTip > 0 && (
                        <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                          <p className="app-title-small !text-[#005F6A]/60 mb-1">
                            Tip
                          </p>
                          <p className="app-title">
                            ${selectedEvent.metadata.totalTip.toFixed(2)}
                          </p>
                        </div>
                      )}
                    {selectedEvent.metadata?.parking !== undefined &&
                      selectedEvent.metadata?.parking !== null &&
                      selectedEvent.metadata?.parking > 0 && (
                        <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                          <p className="app-title-small !text-[#005F6A]/60 mb-1">
                            Parking
                          </p>
                          <p className="app-title">
                            ${selectedEvent.metadata.parking.toFixed(2)}
                          </p>
                        </div>
                      )}
                    {selectedEvent.metadata?.paymentReceived !== undefined && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <p className="app-title-small !text-[#005F6A]/60 mb-1">
                          Payment Status
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.paymentReceived
                            ? "✓ Received"
                            : "Pending"}
                        </p>
                      </div>
                    )}
                    {selectedEvent.metadata?.invoiceSent !== undefined && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <p className="app-title-small !text-[#005F6A]/60 mb-1">
                          Invoice Status
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.invoiceSent ? "✓ Sent" : "Not Sent"}
                        </p>
                      </div>
                    )}
                    {selectedEvent.metadata?.cleaners &&
                      selectedEvent.metadata.cleaners.length > 0 && (
                        <div className="bg-[#005F6A]/5 rounded-2xl p-4 col-span-2">
                          <p className="app-title-small !text-[#005F6A]/60 mb-1">
                            Cleaners
                          </p>
                          <p className="app-title">
                            {selectedEvent.metadata.cleaners
                              .map((c: any) => c.name)
                              .join(", ")}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* TDO-Specific Information */}
              {selectedEvent.metadata?.isTdoAppointment && (
                <div className="space-y-3">
                  <h3 className="section-title">Appointment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedEvent.metadata?.tdoDoctorName && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <p className="app-title-small !text-[#005F6A]/60 mb-1">
                          Doctor
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.tdoDoctorName}
                        </p>
                      </div>
                    )}
                    {selectedEvent.metadata?.tdoLocationName && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <p className="app-title-small !text-[#005F6A]/60 mb-1">
                          Location
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.tdoLocationName}
                        </p>
                      </div>
                    )}
                    {selectedEvent.metadata?.tdoAppointmentFor && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <p className="app-title-small !text-[#005F6A]/60 mb-1">
                          Appointment For
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.tdoAppointmentFor}
                        </p>
                      </div>
                    )}
                    {selectedEvent.metadata?.tdoAppointmentType && (
                      <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                        <p className="app-title-small !text-[#005F6A]/60 mb-1">
                          Type
                        </p>
                        <p className="app-title">
                          {selectedEvent.metadata.tdoAppointmentType}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="space-y-3">
                  <h3 className="section-title">Description</h3>
                  <div className="bg-[#005F6A]/5 rounded-2xl p-4">
                    <p className="text-sm text-[#005F6A] leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#005F6A]/10 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {selectedEvent.metadata?.jobId ? (
                  <Button
                    variant="primary"
                    size="md"
                    className="!px-6 !py-3"
                    onClick={() => {
                      window.location.href = `/jobs/${selectedEvent.metadata.jobId}`;
                    }}>
                    View Full Job Details
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="md"
                    className="!px-6 !py-3 flex items-center gap-2"
                    onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!selectedEvent.metadata?.jobId && (
                  <>
                    <Button
                      variant={selectedEvent.confirmed ? "default" : "primary"}
                      size="md"
                      className="!px-6 !py-3 flex items-center gap-2"
                      onClick={handleConfirmationToggle}>
                      {selectedEvent.confirmed ? (
                        <>
                          <Clock className="h-4 w-4" />
                          Mark as Pending
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Confirm
                        </>
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="md"
                      className="!px-6 !py-3 flex items-center gap-2"
                      onClick={() => {
                        if (selectedEvent) {
                          openEditModal(selectedEvent);
                        }
                      }}>
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                  </>
                )}
                <Button
                  variant="default"
                  size="md"
                  border={false}
                  className="!px-6 !py-3"
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                  }}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        fileName={selectedEvent?.title || "appointment"}
        title="Delete Appointment"
        message="This action cannot be undone."
      />

      {/* Conflict Confirmation Modal */}
      <ConfirmActionModal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        onConfirm={handleConflictConfirm}
        title="Schedule Conflict"
        message={`${scheduleConflictError} Do you want to proceed anyway?`}
        confirmLabel="Proceed Anyway"
        cancelLabel="Cancel"
      />
    </>
  );
};
