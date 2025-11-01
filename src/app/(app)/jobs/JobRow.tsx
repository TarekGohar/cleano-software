"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { CheckCircle2, FileText, Eye, Pencil } from "lucide-react";

interface JobRowProps {
  job: {
    id: string;
    clientName: string;
    location: string | null;
    jobType: string | null;
    jobDate: Date | null;
    startTime: Date;
    endTime: Date | null;
    status: string;
    price: number | null;
    paymentReceived: boolean;
    invoiceSent: boolean;
    cleaners: Array<{ id: string; name: string }>;
  };
}

export function JobRow({ job }: JobRowProps) {
  // Calculate overtime if job has both start and end time
  const calculateOvertime = () => {
    if (!job.endTime) return null;

    const start = new Date(job.startTime);
    const end = new Date(job.endTime);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const standardHours = 8;
    const overtime = Math.max(0, durationHours - standardHours);

    return overtime > 0 ? overtime.toFixed(1) : null;
  };

  const overtime = calculateOvertime();

  return (
    <div
      className="grid hover:bg-gray-50/50 transition-colors items-center"
      style={{
        gridTemplateColumns:
          "120px 1fr 80px 1.5fr 100px 100px 100px 100px 120px 120px 210px",
      }}>
      {/* Date */}
      <span className="px-6 py-4 text-sm text-gray-500 flex items-center whitespace-nowrap">
        {job.jobDate
          ? new Date(job.jobDate).toLocaleDateString()
          : new Date(job.startTime).toLocaleDateString()}
      </span>

      {/* Client */}
      <span className="px-6 py-4 text-sm font-[450] text-gray-900 flex items-center">
        {job.clientName}
      </span>

      {/* Type */}
      <span className="px-4 py-4 flex items-center justify-center whitespace-nowrap">
        {job.jobType ? (
          <Badge
            variant={
              job.jobType === "R"
                ? "secondary"
                : job.jobType === "C"
                ? "default"
                : job.jobType === "PC"
                ? "warning"
                : "default"
            }
            size="sm">
            {job.jobType}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </span>

      {/* Cleaners */}
      <span
        className="px-6 py-4 text-sm text-gray-500 flex items-center truncate"
        title={job.cleaners.map((c) => c.name).join(", ") || "-"}>
        {job.cleaners.length > 0
          ? job.cleaners.map((c) => c.name).join(", ")
          : "-"}
      </span>

      {/* Start Time */}
      <span className="px-4 py-4 text-sm text-gray-500 flex items-center justify-center whitespace-nowrap">
        {new Date(job.startTime).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>

      {/* End Time */}
      <span className="px-4 py-4 text-sm text-gray-500 flex items-center justify-center whitespace-nowrap">
        {job.endTime
          ? new Date(job.endTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-"}
      </span>

      {/* Overtime */}
      <span className="px-4 py-4 text-sm font-[450] flex items-center justify-center whitespace-nowrap">
        {overtime ? (
          <span className="text-orange-600">{overtime}h</span>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </span>

      {/* Price */}
      <span className="px-6 py-4 text-sm font-[450] text-gray-900 flex items-center whitespace-nowrap">
        {job.price ? `$${job.price.toFixed(2)}` : "-"}
      </span>

      {/* Status */}
      <span className="px-6 py-4 flex items-center whitespace-nowrap">
        <Badge
          variant={
            job.status === "COMPLETED"
              ? "success"
              : job.status === "IN_PROGRESS"
              ? "secondary"
              : job.status === "SCHEDULED"
              ? "warning"
              : job.status === "CANCELLED"
              ? "error"
              : "default"
          }
          size="sm">
          {job.status.replace("_", " ")}
        </Badge>
      </span>

      {/* Payment */}
      <span className="px-6 py-4 flex items-center justify-center gap-2 whitespace-nowrap">
        <div title="Payment Received">
          {job.paymentReceived ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-gray-300" />
          )}
        </div>
        <div title="Invoice Sent">
          {job.invoiceSent ? (
            <FileText className="w-5 h-5 text-blue-600" />
          ) : (
            <FileText className="w-5 h-5 text-gray-300" />
          )}
        </div>
      </span>

      {/* Actions */}
      <span className="px-6 py-4 text-right text-sm flex items-center justify-end gap-2">
        <Button
          href={`/jobs/new?edit=${job.id}`}
          variant="default"
          size="sm"
          submit={false}
          className="text-neutral-500 hover:text-neutral-700">
          <Pencil className="w-3 h-3 mr-2" />
          Edit
        </Button>
        <Button
          href={`/jobs/${job.id}`}
          variant="primary"
          size="sm"
          submit={false}
          className="text-neutral-500 hover:text-neutral-700">
          <Eye className="w-3 h-3 mr-2" />
          View
        </Button>
      </span>
    </div>
  );
}
