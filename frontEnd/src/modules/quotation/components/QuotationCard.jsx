import {
  FiCheck,
  FiEdit2,
  FiFileText,
  FiRefreshCw,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { formatCurrency, formatDate } from "../quotation.util";
import StatusBadge from "./StatusBadge";
import {hasPermission} from "../../../utils/permissions";
import ActionButton from "./ActionButton";

const QuotationCard = ({
  quotation,
  role,
  navigate,
  run,
  doReject,
  submit,
  approve,
  reopen,
  remove,
}) => {
  const q = quotation;

  return (
    <div className="rounded-2xl border border-border-color bg-card-bg p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
              <FiFileText size={16} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">
                {q.quotationId || "—"}
              </p>

              <p className="mt-0.5 text-xs text-gray-500">
                {formatDate(q.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <StatusBadge status={q.status} />
      </div>

      {/* Details */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500">Customer</p>
          <p className="mt-1 truncate text-sm font-medium text-text">
            {q.customerId?.name || "—"}
          </p>
          {q.customerId?.contact && (
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {q.customerId.contact}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs text-gray-500">Created by</p>
          <p className="mt-1 truncate text-sm font-medium text-text">
            {q.employeeId?.name || "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Valid until</p>
          <p className="mt-1 text-sm font-medium text-text">
            {q.validUntil ? formatDate(q.validUntil) : "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Grand total</p>
          <p className="mt-1 text-sm font-bold text-text">
            {formatCurrency(q.grandTotal)}
          </p>
        </div>
      </div>

      {/* Rejection reason */}
      {q.rejectionReason && (
        <div className="mt-4 rounded-lg bg-red/10 px-3 py-2">
          <p className="text-xs font-medium text-red">
            Rejection reason
          </p>

          <p className="mt-1 text-xs text-red/80">
            {q.rejectionReason}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border-color pt-4">
        {q.status === "DRAFT" &&
          hasPermission("QUOTATION_UPDATE") && (
            <ActionButton
              icon={FiEdit2}
              label="Edit"
              variant="primary"
              onClick={() =>
                navigate(
                  role === "admin"
                    ? "/admin/add-quotation"
                    : "/employee/quotation",
                  { state: { quotation: q } },
                )
              }
            />
          )}

        {q.status === "DRAFT" &&
          hasPermission("QUOTATION_SUBMIT") && (
            <ActionButton
              icon={FiSend}
              label="Submit"
              variant="success"
              onClick={() => run(submit, q)}
            />
          )}

        {q.status === "SUBMITTED" &&
          hasPermission("QUOTATION_APPROVE") && (
            <ActionButton
              icon={FiCheck}
              label="Approve"
              variant="success"
              onClick={() => run(approve, q)}
            />
          )}

        {q.status === "SUBMITTED" &&
          hasPermission("QUOTATION_REJECT") && (
            <ActionButton
              icon={FiX}
              label="Reject"
              variant="danger"
              onClick={() => doReject(q)}
            />
          )}

        {q.status === "REJECTED" &&
          hasPermission("QUOTATION_UPDATE") && (
            <ActionButton
              icon={FiRefreshCw}
              label="Reopen"
              variant="primary"
              onClick={() => run(reopen, q)}
            />
          )}

        {q.status === "DRAFT" &&
          hasPermission("QUOTATION_ARCHIVE") && (
            <ActionButton
              icon={FiTrash2}
              label="Delete"
              variant="danger"
              onClick={() => run(remove, q)}
            />
          )}
      </div>
    </div>
  );
};

export default QuotationCard;