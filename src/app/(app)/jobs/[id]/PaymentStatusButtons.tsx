"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import {
  togglePaymentReceived,
  toggleInvoiceSent,
} from "../../actions/toggleJobPaymentStatus";

interface PaymentStatusButtonsProps {
  jobId: string;
  paymentReceived: boolean;
  invoiceSent: boolean;
  isAdmin: boolean;
}

export default function PaymentStatusButtons({
  jobId,
  paymentReceived: initialPaymentReceived,
  invoiceSent: initialInvoiceSent,
  isAdmin,
}: PaymentStatusButtonsProps) {
  const [paymentReceived, setPaymentReceived] = useState(
    initialPaymentReceived
  );
  const [invoiceSent, setInvoiceSent] = useState(initialInvoiceSent);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const handleTogglePayment = async () => {
    if (!isAdmin) return;

    setLoadingPayment(true);
    try {
      const result = await togglePaymentReceived(jobId);
      if (result.success && result.newStatus !== undefined) {
        setPaymentReceived(result.newStatus);
      } else {
        alert(result.error || "Failed to update payment status");
      }
    } catch (error) {
      console.error("Error toggling payment:", error);
      alert("Failed to update payment status");
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleToggleInvoice = async () => {
    if (!isAdmin) return;

    setLoadingInvoice(true);
    try {
      const result = await toggleInvoiceSent(jobId);
      if (result.success && result.newStatus !== undefined) {
        setInvoiceSent(result.newStatus);
      } else {
        alert(result.error || "Failed to update invoice status");
      }
    } catch (error) {
      console.error("Error toggling invoice:", error);
      alert("Failed to update invoice status");
    } finally {
      setLoadingInvoice(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-[450] text-[#005F6A]">
          Payment Received
        </span>
        <Button
          variant="alara"
          size="sm"
          onClick={handleTogglePayment}
          disabled={!isAdmin || loadingPayment}>
          {paymentReceived ? (
            <div className="flex items-center gap-2 text-[#005F6A]">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-[450]">Paid</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#005F6A]/40">
              <XCircle className="w-5 h-5" />
              <span className="text-sm font-[450]">Unpaid</span>
            </div>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-[450] text-[#005F6A]">Invoice Sent</span>
        <Button
          variant="alara"
          size="sm"
          onClick={handleToggleInvoice}
          disabled={!isAdmin || loadingInvoice}>
          {invoiceSent ? (
            <div className="flex items-center gap-2 text-[#005F6A]">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-[450]">Sent</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#005F6A]/40">
              <FileText className="w-5 h-5" />
              <span className="text-sm font-[450]">Not Sent</span>
            </div>
          )}
        </Button>
      </div>
    </div>
  );
}
