import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiMapPin,
  FiPhone,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import Header from "../../../shared/components/Header";
import VariantButton from "../../../shared/components/buttons/VariantButton";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import { fetchQuotationAPI } from "../services/quotation.api";
import { formatCurrency, formatDate } from "../quotation.util";

const QuotationDetails = () => {
  const { quotationId } = useParams();
  const navigate = useNavigate();

  const [quotation, setQuotation] = useState(null);

  useEffect(() => {
    fetchQuotationAPI(quotationId)
      .then(({ data }) => setQuotation(data.quotation))
      .catch((error) =>
        toast.error(
          error.response?.data?.message || "Unable to load quotation",
        ),
      );
  }, [quotationId]);

  if (!quotation) {
    return (
      <div className="flex min-w-0 flex-col gap-5">
        <Header title="Quotation Details" />

        <div className="rounded-2xl border border-border-color bg-card-bg p-5 sm:p-6">
          <SkeletonLoader count={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color bg-card-bg text-gray-500 transition hover:bg-bg hover:text-text"
          title="Back"
        >
          <FiArrowLeft size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <Header title={`Quotation ${quotation.quotationId}`} />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left Column */}
        <div className="min-w-0 space-y-5">
          {/* Quotation Information */}
          <section className="overflow-hidden rounded-2xl border border-border-color bg-card-bg">
            <div className="border-b border-border-color px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cta/10 text-cta">
                  <FiFileText size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-text sm:text-base">
                    Quotation Information
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                    Overview of this quotation.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-gray-500">
                  Status
                </p>

                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full bg-cta/10 px-3 py-1.5 text-xs font-medium text-cta">
                    {quotation.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500">
                  Created
                </p>

                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-text">
                  <FiCalendar
                    size={14}
                    className="text-gray-400"
                  />
                  {formatDate(quotation.createdAt)}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500">
                  Valid Until
                </p>

                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-text">
                  <FiCalendar
                    size={14}
                    className="text-gray-400"
                  />
                  {formatDate(quotation.validUntil)}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500">
                  Created By
                </p>

                <div className="mt-2 flex items-center gap-2 text-sm font-medium text-text">
                  <FiUser
                    size={14}
                    className="text-gray-400"
                  />
                  {quotation.employeeId?.name || "—"}
                </div>
              </div>
            </div>
          </section>

          {/* Customer Information */}
          <section className="overflow-hidden rounded-2xl border border-border-color bg-card-bg">
            <div className="border-b border-border-color px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cta/10 text-cta">
                  <FiUsers size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-text sm:text-base">
                    Customer
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                    Customer information associated with this quotation.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="rounded-xl border border-border-color bg-bg p-4">
                <h3 className="text-base font-semibold text-text">
                  {quotation.customerId?.name || "—"}
                </h3>

                <div className="mt-3 space-y-2">
                  {quotation.customerId?.contact && (
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <FiPhone
                        size={15}
                        className="mt-0.5 shrink-0"
                      />

                      <span>
                        {quotation.customerId.contact}
                      </span>
                    </div>
                  )}

                  {quotation.customerId?.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <FiMapPin
                        size={15}
                        className="mt-0.5 shrink-0"
                      />

                      <span>
                        {quotation.customerId.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Approval Information */}
          {quotation.approvedAt && (
            <section className="overflow-hidden rounded-2xl border border-border-color bg-card-bg">
              <div className="p-4 sm:p-6">
                <div className="flex items-start gap-3 rounded-xl bg-green-500/10 p-4">
                  <FiCheckCircle
                    size={20}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-text">
                      Approved
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Approved by{" "}
                      <span className="font-medium text-text">
                        {quotation.approvedBy?.name || "—"}
                      </span>{" "}
                      on{" "}
                      {formatDate(quotation.approvedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Rejection Information */}
          {quotation.rejectionReason && (
            <section className="overflow-hidden rounded-2xl border border-border-color bg-card-bg">
              <div className="p-4 sm:p-6">
                <div className="rounded-xl bg-red/10 p-4">
                  <p className="text-sm font-semibold text-red">
                    Rejection reason
                  </p>

                  <p className="mt-1 text-sm text-red/80">
                    {quotation.rejectionReason}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Products */}
          <section className="overflow-hidden rounded-2xl border border-border-color bg-card-bg">
            <div className="border-b border-border-color px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cta/10 text-cta">
                    <FiFileText size={18} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-text sm:text-base">
                      Quotation Items
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                      Products and pricing included in this quotation.
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-gray-500">
                  {quotation.items?.length || 0}{" "}
                  {quotation.items?.length === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-bg">
                  <tr className="border-b border-border-color text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4 font-medium">
                      Product
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Quantity
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Unit Price
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Discount
                    </th>

                    <th className="px-4 py-4 font-medium">
                      Tax
                    </th>

                    <th className="px-5 py-4 text-right font-medium">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr
                      key={item._id || index}
                      className="border-b border-border-color last:border-0"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-text">
                          {item.productName}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-500">
                        {item.quantity}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatCurrency(item.unitPrice)}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatCurrency(item.discountAmount)}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-500">
                        {item.gstRate}%{" "}
                        <span className="text-xs">
                          ({formatCurrency(item.gstAmount)})
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-semibold text-text">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="space-y-3 p-4 lg:hidden">
              {quotation.items.map((item, index) => (
                <div
                  key={item._id || index}
                  className="rounded-xl border border-border-color bg-bg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-text">
                        {item.productName}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <p className="whitespace-nowrap text-sm font-bold text-text">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-gray-500">
                        Unit Price
                      </p>

                      <p className="mt-1 text-sm font-medium text-text">
                        {formatCurrency(item.unitPrice)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Discount
                      </p>

                      <p className="mt-1 text-sm font-medium text-text">
                        {formatCurrency(item.discountAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        GST Rate
                      </p>

                      <p className="mt-1 text-sm font-medium text-text">
                        {item.gstRate}%
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        GST Amount
                      </p>

                      <p className="mt-1 text-sm font-medium text-text">
                        {formatCurrency(item.gstAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notes */}
          {quotation.notes && (
            <section className="overflow-hidden rounded-2xl border border-border-color bg-card-bg">
              <div className="border-b border-border-color px-4 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cta/10 text-cta">
                    <FiFileText size={18} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-text sm:text-base">
                      Notes
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                      Additional quotation information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-500">
                  {quotation.notes}
                </p>
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <aside className="min-w-0">
          <div className="sticky top-5 overflow-hidden rounded-2xl border border-border-color bg-card-bg">
            <div className="border-b border-border-color px-5 py-4">
              <h2 className="text-base font-semibold text-text">
                Quotation Summary
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Financial breakdown of this quotation.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-text">
                    {formatCurrency(quotation.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Discount
                  </span>

                  <span className="font-medium text-red">
                    - {formatCurrency(quotation.discountAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Taxable
                  </span>

                  <span className="font-medium text-text">
                    {formatCurrency(quotation.taxableAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    GST
                  </span>

                  <span className="font-medium text-text">
                    {formatCurrency(quotation.gstAmount)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-border-color" />

              <div className="rounded-xl bg-bg p-4">
                <p className="text-xs text-gray-500">
                  Grand Total
                </p>

                <p className="mt-1 text-2xl font-bold text-text">
                  {formatCurrency(quotation.grandTotal)}
                </p>
              </div>

              <div className="pt-1">
                <VariantButton
                  onClick={() => navigate(-1)}
                  variant="ghostCta"
                  size="medium"
                  text="Back"
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default QuotationDetails;