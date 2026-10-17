import { formatCurrency } from "../../../quotation.util";

const QuotationItemsTable = ({ items = [] }) => {
  return (
    <div className="mt-8">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-text">
          Products & Services
        </h2>

        <p className="mt-0.5 text-xs text-gray-500">
          Quoted products and pricing
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-color">
        <table className="w-full min-w-[700px] text-left">
          <thead className="bg-bg">
            <tr className="text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Product</th>

              <th className="px-3 py-3 text-center font-medium">Qty</th>

              <th className="px-3 py-3 text-right font-medium">Unit Price</th>

              <th className="px-3 py-3 text-right font-medium">Discount</th>

              <th className="px-3 py-3 text-right font-medium">GST</th>

              <th className="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item, index) => {
              return (
                <tr
                  key={item._id || index}
                  className="border-t border-border-color"
                >
                  <td className="px-4 py-4">
                    <p className="font-medium text-text">
                      {item.productName || "—"}
                    </p>

                    {item.sku && (
                      <p className="mt-0.5 text-xs text-gray-500">{item.sku}</p>
                    )}
                  </td>

                  <td className="px-3 py-4 text-center text-sm text-text">
                    {item.quantity}
                  </td>

                  <td className="px-3 py-4 text-right text-sm text-text">
                    {formatCurrency(item.unitPrice)}
                  </td>

                  <td className="px-3 py-4 text-right text-sm text-text">
                    {formatCurrency(item.discountAmount)}
                    {Number(item.discountPercentage) > 0 && <span className="block text-xs text-gray-500">{item.discountPercentage}%</span>}
                  </td>

                  <td className="px-3 py-4 text-right text-sm text-text">
                    {item.gstRate ?? "—"}{item.gstRate != null ? "%" : ""}
                    <span className="block text-xs text-gray-500">{formatCurrency(item.gstAmount)}</span>
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-text">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuotationItemsTable;
