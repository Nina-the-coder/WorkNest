import { toast } from "react-toastify";

import VariantButton from "../../../../../shared/components/buttons/VariantButton";

const QuotationWorkflowActions = ({ quotation, role }) => {
  const status = quotation.status?.toLowerCase();

  if (
    status !== "submitted" &&
    status !== "approved" &&
    status !== "rejected"
  ) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-wrap items-center justify-end gap-2">
      {/* Submitted */}
      {status === "submitted" && (
        <>
          <VariantButton
            variant="ghostRed"
            size="medium"
            text="Reject"
            icon="x"
            onClick={() => {
              toast.info("Reject action will be connected next.");
            }}
          />

          <VariantButton
            variant="cta"
            size="medium"
            text="Approve"
            icon="check"
            onClick={() => {
              toast.info("Approve action will be connected next.");
            }}
          />
        </>
      )}

      {/* Approved */}
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

      {/* Rejected */}
      {status === "rejected" && (
        <p className="mr-auto text-sm text-gray-500">
          This quotation was rejected and can be revised.
        </p>
      )}
    </div>
  );
};

export default QuotationWorkflowActions;
