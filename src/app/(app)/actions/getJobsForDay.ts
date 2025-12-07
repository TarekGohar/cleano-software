"use server";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Utility to clamp a date to start/end of day in local time
function getDayBounds(dateStr: string) {
  const day = new Date(dateStr);
  if (Number.isNaN(day.getTime())) {
    throw new Error("Invalid date");
  }
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getJobsForDay(dateStr: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const isAdmin =
    (session.user as any).role === "ADMIN" ||
    (session.user as any).role === "OWNER";

  const { start, end } = getDayBounds(dateStr);

  const where: any = {
    OR: [
      // jobDate within day
      { jobDate: { gte: start, lte: end } },
      // startTime within day
      { startTime: { gte: start, lte: end } },
    ],
  };

  if (!isAdmin) {
    where.AND = [
      {
        OR: [
          { employeeId: session.user.id },
          { cleaners: { some: { id: session.user.id } } },
        ],
      },
    ];
  }

  const jobs = await db.job.findMany({
    where,
    include: {
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      cleaners: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ jobDate: "asc" }, { startTime: "asc" }],
  });

  return jobs.map((job) => {
    const startTime = new Date(job.startTime);
    const endTime = job.endTime ? new Date(job.endTime) : undefined;
    const cleanerNames = job.cleaners.map((c) => c.name).join(", ");
    const label = cleanerNames || job.employee.name;

    return {
      id: job.id,
      title: job.clientName,
      description: job.description || undefined,
      label,
      start: startTime.toISOString(),
      end: endTime?.toISOString(),
      confirmed: job.status !== "CREATED" && job.status !== "CANCELLED",
      importance:
        job.status === "IN_PROGRESS"
          ? 5
          : job.status === "SCHEDULED"
          ? 3
          : 1,
      metadata: {
        jobId: job.id,
        jobType: job.jobType,
        location: job.location,
        status: job.status,
        price: job.price,
        employeePay: job.employeePay,
        totalTip: job.totalTip,
        parking: job.parking,
        paymentReceived: job.paymentReceived,
        invoiceSent: job.invoiceSent,
        notes: job.notes,
        employeeId: job.employee.id,
        employeeName: job.employee.name,
        cleaners: job.cleaners,
      },
    };
  });
}

