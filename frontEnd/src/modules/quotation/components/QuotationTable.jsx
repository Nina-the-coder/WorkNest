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
import { hasPermission } from "../../../utils/permissions";
import ActionButton from "./ActionButton";

const QuotationTable = ({
  quotations,
  role,
  navigate,
  run,
  doReject,
  submit,
  approve,
  reopen,
  remove,
}) => {
  if (!quotations || quotations.length === 0) {
    return (
      <div className="rounded-2xl border border-border-color bg-card-bg p-8 text-center">
        <p className="text-sm text-gray-500">No quotations found</p>
      </div>
    );
  }

  const getDetailsRoute = (quotationId) => {
    return role === "admin"
      ? `/admin/quotations/${quotationId}`
      : `/employee/quotations/${quotationId}`;
  };

  const getEditRoute = () => {
    return role === "admin" ? "/admin/add-quotation" : "/employee/quotation";
  };

  return (
    <div className="hidden overflow-hidden rounded-2xl border border-border-color bg-card-bg xl:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left">
          <thead className="bg-bg">
            <tr className="text-xs uppercase tracking-wide text-gray-500">
              <th className="px-5 py-4 font-medium">Quotation</th>

              <th className="px-4 py-4 font-medium">Customer</th>

              <th className="px-4 py-4 font-medium">Created By</th>

              <th className="px-4 py-4 font-medium">Date</th>

              <th className="px-4 py-4 text-right font-medium">Total</th>

              <th className="px-4 py-4 font-medium">Status</th>

              <th className="px-4 py-4 font-medium">Valid Until</th>

              <th className="px-5 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {quotations.map((q) => (
              <tr
                key={q._id}
                onClick={() => navigate(getDetailsRoute(q._id))}
                className="cursor-pointer border-b border-border-color last:border-0 transition hover:bg-bg/60"
              >
                {/* -------------------------------------------------------- */}
                {/* Quotation Number                                         */}
                {/* -------------------------------------------------------- */}

                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
                      <FiFileText size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text transition-colors hover:text-cta">
                        {q.quotationId || "—"}
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatDate(q.createdAt)}
                      </p>
                    </div>
                  </div>
                </td>

                {/* -------------------------------------------------------- */}
                {/* Customer                                                  */}
                {/* -------------------------------------------------------- */}

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

                {/* -------------------------------------------------------- */}
                {/* Employee                                                  */}
                {/* -------------------------------------------------------- */}

                <td className="px-4 py-4">
                  <p className="text-sm text-text">
                    {q.employeeId?.name || "—"}
                  </p>
                </td>

                {/* -------------------------------------------------------- */}
                {/* Date                                                      */}
                {/* -------------------------------------------------------- */}

                <td className="px-4 py-4">
                  <p className="whitespace-nowrap text-sm text-gray-500">
                    {formatDate(q.createdAt)}
                  </p>
                </td>

                {/* -------------------------------------------------------- */}
                {/* Total                                                     */}
                {/* -------------------------------------------------------- */}

                <td className="px-4 py-4 text-right">
                  <p className="whitespace-nowrap text-sm font-semibold text-text">
                    {formatCurrency(q.grandTotal)}
                  </p>
                </td>

                {/* -------------------------------------------------------- */}
                {/* Status                                                    */}
                {/* -------------------------------------------------------- */}

                <td className="px-4 py-4">
                  <StatusBadge status={q.status} />
                </td>

                {/* -------------------------------------------------------- */}
                {/* Valid Until                                               */}
                {/* -------------------------------------------------------- */}

                <td className="px-4 py-4">
                  <p className="whitespace-nowrap text-sm text-gray-500">
                    {q.validUntil ? formatDate(q.validUntil) : "—"}
                  </p>
                </td>

                {/* -------------------------------------------------------- */}
                {/* Actions                                                    */}
                {/* -------------------------------------------------------- */}

                <td
                  className="px-5 py-4"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {/* Edit */}
                    {q.status === "DRAFT" &&
                      hasPermission("QUOTATION_UPDATE") && (
                        <ActionButton
                          icon={FiEdit2}
                          label="Edit"
                          variant="primary"
                          onClick={() => {
                            navigate(getEditRoute(), {
                              state: {
                                quotation: q,
                              },
                            });
                          }}
                        />
                      )}

                    {/* Submit */}
                    {q.status === "DRAFT" &&
                      hasPermission("QUOTATION_SUBMIT") && (
                        <ActionButton
                          icon={FiSend}
                          label="Submit"
                          variant="success"
                          onClick={() => run(submit, q)}
                        />
                      )}

                    {/* Approve */}
                    {q.status === "SUBMITTED" &&
                      hasPermission("QUOTATION_APPROVE") && (
                        <ActionButton
                          icon={FiCheck}
                          label="Approve"
                          variant="success"
                          onClick={() => run(approve, q)}
                        />
                      )}

                    {/* Reject */}
                    {q.status === "SUBMITTED" &&
                      hasPermission("QUOTATION_REJECT") && (
                        <ActionButton
                          icon={FiX}
                          label="Reject"
                          variant="danger"
                          onClick={() => doReject(q)}
                        />
                      )}

                    {/* Reopen */}
                    {q.status === "REJECTED" &&
                      hasPermission("QUOTATION_UPDATE") && (
                        <ActionButton
                          icon={FiRefreshCw}
                          label="Reopen"
                          variant="primary"
                          onClick={() => run(reopen, q)}
                        />
                      )}

                    {/* Delete */}
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
  );
};

export default QuotationTable;
