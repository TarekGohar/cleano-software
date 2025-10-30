"use client";

import { useState, createContext, useContext } from "react";
import Button from "@/components/ui/Button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  clientName: string;
  location: string | null;
  jobType: string | null;
  jobDate: Date | null;
  startTime: Date;
  status: string;
  price: number | null;
}

interface JobModalContextType {
  openCreateModal: () => void;
  openEditModal: (jobId: string) => void;
}

const JobModalContext = createContext<JobModalContextType | undefined>(
  undefined
);

export const useJobModal = () => {
  const context = useContext(JobModalContext);
  if (!context) {
    throw new Error("useJobModal must be used within JobModalProvider");
  }
  return context;
};

export function JobModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const openCreateModal = () => {
    // Redirect to full form for job creation
    window.location.href = "/jobs/new";
  };

  const openEditModal = (jobId: string) => {
    // Redirect to full form for editing
    window.location.href = `/jobs/new?edit=${jobId}`;
  };

  return (
    <JobModalContext.Provider value={{ openCreateModal, openEditModal }}>
      {children}
    </JobModalContext.Provider>
  );
}

export function CreateJobButton() {
  return (
    <Link href="/jobs/new">
      <Button variant="primary" size="md" submit={false}>
        <Plus className="w-4 h-4 mr-2" />
        Create New Job
      </Button>
    </Link>
  );
}

