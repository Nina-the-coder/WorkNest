import React from "react";
import VariantButton from "../buttons/VariantButton";

const QuotationTable = ({
  quotations,
  editQuotation,
  deleteQuotation,
  approveQuotation,
  rejectQuotation,
  makeOrder,
}) => {
  if (!quotations || quotations.length === 0) {
    return (
      <div className="w-full flex justify-center items-center p-6 text-secondary-text">
        No quotations found
      </div>
    );
  }

  return (
    <div className="w-full bg-card-bg/50 rounded-2xl shadow-md shadow-secondary-text/30 overflow-x-auto">
      <table className="w-full table-fixed text-sm text-left text-secondary-text border-collapse">
        {/* Header */}
        <thead className="text-xs uppercase bg-card-bg text-text">
          <tr>
            <th className="w-[8%] px-4 py-3">Quotation</th>
            <th className="w-[7%] px-4 py-3">Customer</th>
            <th className="w-[7%] px-4 py-3">Added By</th>
            <th className="w-[10%] px-4 py-3">Doctor</th>
            <th className="w-[12%] px-4 py-3">Admin</th>
            <th className="w-[30%] px-4 py-3">Products</th>
            <th className="w-[10%] px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {quotations.map((quotation) => (
            <tr
              key={quotation.quotationId}
              className="border-b border-gray-700 hover:bg-bg/50 transition align-top"
            >
              {/* Quotation ID */}
              <td className="px-4 py-4 font-semibold text-text text-sm">
                {quotation.quotationId}
              </td>

              {/* Customer */}
              <td className="px-4 py-4">
                <div className="flex flex-col">
                  <span className="font-medium text-text text-sm">
                    {quotation.customerId?.customerId}
                  </span>
                  <span className="text-xs text-secondary-text truncate">
                    {quotation.customerId?.name}
                  </span>
                </div>
              </td>

              {/* Added By */}
              <td className="px-4 py-4">
                <div className="flex flex-col">
                  <span className="font-medium text-text text-sm">
                    {quotation.addedBy?.empId}
                  </span>
                  <span className="text-xs text-secondary-text truncate">
                    {quotation.addedBy?.name}
                  </span>
                </div>
              </td>

              {/* Doctor Status */}
              <td className="px-4 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    quotation.isApprovedByDoctor === "approved"
                      ? "bg-green text-black"
                      : quotation.isApprovedByDoctor === "pending"
                      ? "bg-orange text-black"
                      : "bg-red text-black"
                  }`}
                >
                  {quotation.isApprovedByDoctor}
                </span>
              </td>

              {/* Admin Status + Approve/Reject */}
              <td className="px-4 py-4">
                <div className="flex flex-col items-center justify-between gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold text-center ${
                      quotation.status === "approved"
                        ? "bg-green text-black"
                        : quotation.status === "pending"
                        ? "bg-orange text-black"
                        : "bg-red text-black"
                    }`}
                  >
                    {quotation.status}
                  </span>
                  <div className="flex gap-1">
                    <VariantButton
                      onClick={(e) => approveQuotation(e, quotation)}
                      variant="ghostGreen"
                      size="tiny"
                      text=""
                      icon="check"
                    />
                    <VariantButton
                      onClick={(e) => rejectQuotation(e, quotation)}
                      variant="ghostRed"
                      size="tiny"
                      text=""
                      icon="x"
                    />
                  </div>
                </div>
              </td>

              {/* Products mini-table */}
              <td className="px-4 py-4">
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-bg/30">
                      <tr className="text-text">
                        <th className="text-left px-2 py-1">Product</th>
                        <th className="text-center px-2 py-1">Qty</th>
                        <th className="text-right px-2 py-1">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotation.products.map((p, i) => (
                        <tr key={i}>
                          <td className="px-2 py-1">{p.name}</td>
                          <td className="text-center px-2 py-1">{p.quantity}</td>
                          <td className="text-right px-2 py-1">₹{p.price}</td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr className="font-semibold text-text border-t bg-bg/20">
                        <td colSpan={2} className="text-right pr-2 py-1">
                          Total:
                        </td>
                        <td className="text-right px-2 py-1">
                          ₹{quotation.total}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>

              {/* Actions */}
              <td className="px-4 py-4 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-4">
                    <VariantButton
                      onClick={(e) => editQuotation(e, quotation)}
                      variant="ghostCta"
                      size="tiny"
                      text=""
                      icon="pencil"
                    />
                    <VariantButton
                      onClick={(e) => deleteQuotation(e, quotation.quotationId)}
                      variant="red"
                      size="tiny"
                      text=""
                      icon="trash-2"
                    />
                  </div>
                  <VariantButton
                    onClick={(e) => makeOrder(e, quotation)}
                    variant="cta"
                    size="small"
                    text="Order"
                    icon="arrow-right"
                    className={`w-full ${
                      quotation.status !== "approved" ? "opacity-50" : ""
                    }`}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuotationTable;
