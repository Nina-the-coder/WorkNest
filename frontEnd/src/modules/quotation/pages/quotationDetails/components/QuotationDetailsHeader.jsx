import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

import Header from "../../../../../shared/components/Header";
import VariantButton from "../../../../../shared/components/buttons/VariantButton";

import { STATUS_CONFIG } from "../../../constants/quotation.constants";

const QuotationDetailsHeader = ({ quotation, role, onBack }) => {
  const navigate = useNavigate();
  const status = quotation?.status?.toLowerCase();

  const statusConfig = STATUS_CONFIG[status];

  const canEdit = status === "draft" || status === "rejected";

  const handleEdit = () => {
    if (!quotation) return;

    navigate(
      role === "admin"
        ? `/admin/quotations/${quotation._id}/edit`
        : `/employee/quotations/${quotation._id}/edit`,
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color bg-card-bg text-gray-500 transition hover:text-text"
          title="Go back"
        >
          <FiArrowLeft size={18} />
        </button>

        <div className="min-w-0">
          <Header
            title={
              quotation
                ? `Quotation ${quotation.quotationNumber || quotation.quotationId || "—"}`
                : "Quotation"
            }
          />

          {quotation && (
            <div className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  statusConfig?.className || "bg-gray-100 text-gray-600"
                }`}
              >
                {statusConfig?.label || quotation.status || "Unknown"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {quotation && (
        <div className="flex shrink-0 items-center gap-2">
          {canEdit && (
            <VariantButton
              onClick={handleEdit}
              variant="ghostCta"
              size="medium"
              text="Edit"
              icon="edit"
            />
          )}

          <VariantButton
            onClick={() => {
              // PDF implementation later
            }}
            variant="cta"
            size="medium"
            text="Download PDF"
          />
        </div>
      )}
    </div>
  );
};

export default QuotationDetailsHeader;
