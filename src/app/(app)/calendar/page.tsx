import React from "react";
import { getJobsForCalendar } from "@/app/(app)/actions/getJobsForCalendar";
import CalendarPageClient from "./CalendarPageClient";

export default async function CalendarPage() {
  // Fetch jobs for the current month (expandable range)
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1); // 1 month before
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // 2 months after

  const jobEvents = await getJobsForCalendar(startDate, endDate);

  return <CalendarPageClient initialEvents={jobEvents} />;
}

