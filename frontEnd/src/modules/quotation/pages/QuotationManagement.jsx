import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiCheck,
  FiChevronDown,
  FiEdit2,
  FiFileText,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import Header from "../../../shared/components/Header";
import VariantButton from "../../../shared/components/buttons/VariantButton";
import PaginationControls from "../../../shared/components/PaginationControls";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import NoItemFoundModal from "../../../shared/components/NoItemFoundModal";
import useDebounce from "../../../shared/hooks/useDebounce";
import { hasPermission } from "../../../utils/permissions";
import { useQuotations } from "../hooks/useQuotations";
import { formatCurrency, formatDate } from "../quotation.util";

/* -------------------------------------------------------------------------- */
/* Status configuration                                                       */
/* -------------------------------------------------------------------------- */

const STATUS_CONFIG = {
  DRAFT: {
    label: "Draft",
    className: "bg-gray-500/10 text-gray-500",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-blue-500/10 text-blue-500",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-500/10 text-green-500",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red/10 text-red",
  },
  EXPIRED: {
    label: "Expired",
    className: "bg-orange-500/10 text-orange-500",
  },
};

const STATUSES = Object.keys(STATUS_CONFIG);

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    className: "bg-gray-500/10 text-gray-500",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Action Button                                                              */
/* -------------------------------------------------------------------------- */

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "default",
}) => {
  const variants = {
    default:
      "border-border-color text-gray-500 hover:bg-bg hover:text-text",
    success:
      "border-green-500/20 text-green-600 hover:bg-green-500/10",
    danger:
      "border-red/20 text-red hover:bg-red/10",
    primary:
      "border-cta/20 text-cta hover:bg-cta/10",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition ${variants[variant]}`}
    >
      <Icon size={13} />
      <span>{label}</span>
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* Mobile Quotation Card                                                      */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Quotation Management                                                       */
/* -------------------------------------------------------------------------- */

const QuotationManagement = ({ role = "admin" }) => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debouncedSearch = useDebounce(search, 400);

  const {
    quotations,
    totalPages,
    totalItems,
    loading,
    approve,
    reject,
    submit,
    reopen,
    remove,
  } = useQuotations({
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  const doReject = async (quotation) => {
    const reason = window.prompt(
      "Why is this quotation being rejected?",
    );

    if (!reason?.trim()) {
      return toast.warn("A rejection reason is required");
    }

    try {
      await reject(quotation, reason);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to reject quotation",
      );
    }
  };

  const run = async (fn, quotation) => {
    try {
      await fn(quotation);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Action failed",
      );
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Create route                                                             */
  /* ------------------------------------------------------------------------ */

  const handleCreate = () => {
    navigate(
      role === "admin"
        ? "/admin/add-quotation"
        : "/employee/quotation",
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-8">
      {/* Header */}
      <Header title="Quotation Management" />

      {/* Toolbar */}
      <div className="rounded-2xl border border-border-color bg-card-bg p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search + filter */}
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative min-w-0 sm:w-72">
              <FiSearch
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />

              <input
                className="h-10 w-full rounded-xl border border-border-color bg-bg pl-9 pr-3 text-sm text-text outline-none transition placeholder:text-gray-400 focus:border-cta focus:ring-2 focus:ring-cta/10"
                placeholder="Search quotation number..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>

            {/* Status */}
            <div className="relative sm:w-44">
              <select
                className="h-10 w-full appearance-none rounded-xl border border-border-color bg-bg px-3 pr-9 text-sm text-text outline-none transition focus:border-cta focus:ring-2 focus:ring-cta/10"
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="">All statuses</option>

                {STATUSES.map((quotationStatus) => (
                  <option
                    key={quotationStatus}
                    value={quotationStatus}
                  >
                    {STATUS_CONFIG[quotationStatus].label}
                  </option>
                ))}
              </select>

              <FiChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
            </div>
          </div>

          {/* Create */}
          {hasPermission("QUOTATION_CREATE") && (
            <VariantButton
              onClick={handleCreate}
              variant="cta"
              size="medium"
              text="New quotation"
              icon="plus"
            />
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <div className="mt-4 border-t border-border-color pt-3">
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-medium text-text">
                {quotations.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-text">
                {totalItems}
              </span>{" "}
              quotations
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-border-color bg-card-bg p-4 sm:p-6">
          <SkeletonLoader count={6} />
        </div>
      ) : quotations.length === 0 ? (
        <div className="rounded-2xl border border-border-color bg-card-bg p-4 sm:p-6">
          <NoItemFoundModal message="No quotations found" />
        </div>
      ) : (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* Desktop Table                                                   */}
          {/* ---------------------------------------------------------------- */}

          <div className="hidden overflow-hidden rounded-2xl border border-border-color bg-card-bg xl:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-bg">
                  <tr className="border-b border-border-color text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4 font-medium">
                      Quotation
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Customer
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Created By
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Date
                    </th>

                    <th className="px-4 py-4 text-right font-medium">
                      Total
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Status
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Valid Until
                    </th>

                    <th className="px-5 py-4 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {quotations.map((q) => (
                    <tr
                      key={q._id}
                      className="border-b border-border-color last:border-0 transition hover:bg-bg/60"
                    >
                      {/* Number */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
                            <FiFileText size={16} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-text">
                              {q.quotationId || "—"}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-500">
                              {formatDate(q.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-4">
                        <p className="max-w-[180px] truncate text-sm font-medium text-text">
                          {q.customerId?.name || "—"}
                        </p>

                        {q.customerId?.contact && (
                          <p className="mt-0.5 max-w-[180px] truncate text-xs text-gray-500">
                            {q.customerId.contact}
                          </p>
                        )}
                      </td>

                      {/* Employee */}
                      <td className="px-4 py-4">
                        <p className="text-sm text-text">
                          {q.employeeId?.name || "—"}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-500">
                          {formatDate(q.createdAt)}
                        </p>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-4 text-right">
                        <p className="whitespace-nowrap text-sm font-semibold text-text">
                          {formatCurrency(q.grandTotal)}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        <StatusBadge status={q.status} />
                      </td>

                      {/* Valid Until */}
                      <td className="px-4 py-4">
                        <p className="whitespace-nowrap text-sm text-gray-500">
                          {q.validUntil
                            ? formatDate(q.validUntil)
                            : "—"}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {q.status === "DRAFT" &&
                            hasPermission(
                              "QUOTATION_UPDATE",
                            ) && (
                              <ActionButton
                                icon={FiEdit2}
                                label="Edit"
                                variant="primary"
                                onClick={() =>
                                  navigate(
                                    role === "admin"
                                      ? "/admin/add-quotation"
                                      : "/employee/quotation",
                                    {
                                      state: {
                                        quotation: q,
                                      },
                                    },
                                  )
                                }
                              />
                            )}

                          {q.status === "DRAFT" &&
                            hasPermission(
                              "QUOTATION_SUBMIT",
                            ) && (
                              <ActionButton
                                icon={FiSend}
                                label="Submit"
                                variant="success"
                                onClick={() =>
                                  run(submit, q)
                                }
                              />
                            )}

                          {q.status === "SUBMITTED" &&
                            hasPermission(
                              "QUOTATION_APPROVE",
                            ) && (
                              <ActionButton
                                icon={FiCheck}
                                label="Approve"
                                variant="success"
                                onClick={() =>
                                  run(approve, q)
                                }
                              />
                            )}

                          {q.status === "SUBMITTED" &&
                            hasPermission(
                              "QUOTATION_REJECT",
                            ) && (
                              <ActionButton
                                icon={FiX}
                                label="Reject"
                                variant="danger"
                                onClick={() =>
                                  doReject(q)
                                }
                              />
                            )}

                          {q.status === "REJECTED" &&
                            hasPermission(
                              "QUOTATION_UPDATE",
                            ) && (
                              <ActionButton
                                icon={FiRefreshCw}
                                label="Reopen"
                                variant="primary"
                                onClick={() =>
                                  run(reopen, q)
                                }
                              />
                            )}

                          {q.status === "DRAFT" &&
                            hasPermission(
                              "QUOTATION_ARCHIVE",
                            ) && (
                              <ActionButton
                                icon={FiTrash2}
                                label="Delete"
                                variant="danger"
                                onClick={() =>
                                  run(remove, q)
                                }
                              />
                            )}
                        </div>

                        {q.rejectionReason && (
                          <p className="mt-2 max-w-[240px] text-right text-xs text-red">
                            {q.rejectionReason}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Mobile / Tablet Cards                                            */}
          {/* ---------------------------------------------------------------- */}

          <div className="grid gap-3 xl:hidden">
            {quotations.map((q) => (
              <QuotationCard
                key={q._id}
                quotation={q}
                role={role}
                navigate={navigate}
                run={run}
                doReject={doReject}
                submit={submit}
                approve={approve}
                reopen={reopen}
                remove={remove}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="rounded-2xl border border-border-color bg-card-bg p-3 sm:p-4">
            <PaginationControls
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              limit={limit}
              setLimit={(value) => {
                setLimit(value);
                setPage(1);
              }}
              totalItems={totalItems}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default QuotationManagement;