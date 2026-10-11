import { toast } from "react-toastify";
import VariantButton from "../../../../../shared/components/buttons/VariantButton";
import { useQuotations } from "../../../hooks/useQuotations";

const QuotationWorkflowActions = ({ quotation, role }) => {
  const status = quotation.status?.toLowerCase();

  const {
    approve,
    reject,
    submit,
  } = useQuotations({});

  const handleSubmit = async () => {
    try {
      await submit(quotation);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to submit quotation",
      );
    }
  };

  const handleApprove = async () => {
    try {
      await approve(quotation);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to approve quotation",
      );
    }
  };

  const handleReject = async () => {
    const reason = window.prompt(
      "Why is this quotation being rejected?",
    );

    if (!reason?.trim()) {
      toast.warn("A rejection reason is required");
      return;
    }

    try {
      await reject(quotation, reason);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to reject quotation",
      );
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-wrap items-center justify-end gap-2">

      {/* ------------------------------------------------------------------ */}
      {/* DRAFT                                                              */}
      {/* ------------------------------------------------------------------ */}

      {status === "draft" && (
        <VariantButton
          variant="cta"
          size="medium"
          text="Submit for Approval"
          icon="send"
          onClick={handleSubmit}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SUBMITTED                                                          */}
      {/* ------------------------------------------------------------------ */}

      {status === "submitted" && (
        <>
          <VariantButton
            variant="ghostRed"
            size="medium"
            text="Reject"
            icon="x"
            onClick={handleReject}
          />

          <VariantButton
            variant="cta"
            size="medium"
            text="Approve"
            icon="check"
            onClick={handleApprove}
          />
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* APPROVED                                                           */}
      {/* ------------------------------------------------------------------ */}

      {status === "approved" && (
        <VariantButton
          variant="cta"
          size="medium"
          text="Convert to Order"
          onClick={() => {
            toast.info("Order conversion will be connected next.");
          }}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* REJECTED                                                           */}
      {/* ------------------------------------------------------------------ */}

      {status === "rejected" && (
        <p className="mr-auto text-sm text-gray-500">
          This quotation was rejected and can be revised.
        </p>
      )}
    </div>
  );
};

export default QuotationWorkflowActions;