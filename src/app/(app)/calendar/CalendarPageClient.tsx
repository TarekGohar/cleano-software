"use client";

import React, { useRef, useEffect } from "react";
import Calendar from "@/components/calendar/Calendar";
import { CalendarRef, CalendarEvent } from "@/components/calendar/types";
import { CalendarProvider } from "@/components/calendar/CalendarContext";

interface CalendarPageClientProps {
  initialEvents: Array<{
    id: string;
    title: string;
    description?: string;
    label?: string;
    start: string;
    end?: string;
    confirmed?: boolean;
    importance?: number | null;
    metadata?: Record<string, any>;
  }>;
}

export default function CalendarPageClient({
  initialEvents,
}: CalendarPageClientProps) {
  const calendarRef = useRef<CalendarRef>(null);

  // Transform the initial events from server (with ISO strings) to CalendarEvent format (with Date objects)
  const events: CalendarEvent[] = initialEvents.map((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    label: event.label || null,
    start: new Date(event.start),
    end: event.end ? new Date(event.end) : undefined,
    confirmed: event.confirmed,
    importance: event.importance,
    metadata: event.metadata,
  }));

  return (
    <CalendarProvider initialEvents={events}>
      <div className="h-full overflow-hidden">
        <Calendar ref={calendarRef} />
      </div>
    </CalendarProvider>
  );
}

