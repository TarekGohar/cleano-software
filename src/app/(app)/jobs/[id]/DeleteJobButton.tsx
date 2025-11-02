"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Trash2 } from "lucide-react";

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Deleting...
        </span>
      ) : (
        <>Delete Job</>
      )}
    </Button>
  );
}

export default function DeleteJobButton({
  jobId,
  deleteAction,
}: {
  jobId: string;
  deleteAction: () => Promise<void>;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsModalOpen(true)}
        type="button">
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Job
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Delete Job">
        <p className="text-neutral-950/70 mb-6">
          Are you sure you want to delete this job? This action cannot be
          undone.
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(false)}
            type="button">
            Cancel
          </Button>
          <form action={deleteAction}>
            <DeleteButton />
          </form>
        </div>
      </Modal>
    </>
  );
}
