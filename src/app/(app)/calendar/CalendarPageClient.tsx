"use client";

import React, { useMemo, useRef } from "react";
import Calendar from "@/components/calendar/Calendar";
import { CalendarRef, CalendarEvent } from "@/components/calendar/types";
import { CalendarProvider } from "@/components/calendar/CalendarContext";
import { useCalendarData } from "@/hooks/useCalendarData";

export default function CalendarPageClient() {
  const calendarRef = useRef<CalendarRef>(null);

  // Default range: current month (will be refined with view-aware range in Phase 7)
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate: start, endDate: end };
  }, []);

  const { events: rawEvents, mutateRange } = useCalendarData(
    startDate,
    endDate
  );

  const events: CalendarEvent[] = useMemo(
    () =>
      rawEvents.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        label: event.label || null,
        start: new Date(event.start),
        end: event.end ? new Date(event.end) : undefined,
        confirmed: event.confirmed,
        importance: event.importance,
        metadata: event.metadata,
      })),
    [rawEvents]
  );

  // Expose mutateRange globally for CalendarContext to call when invalidating
  React.useEffect(() => {
    (window as any).__calendarMutateRange = mutateRange;
    return () => {
      delete (window as any).__calendarMutateRange;
    };
  }, [mutateRange]);

  return (
    <CalendarProvider initialEvents={events}>
      <div className="h-full overflow-hidden">
        <Calendar ref={calendarRef} />
      </div>
    </CalendarProvider>
  );
}

