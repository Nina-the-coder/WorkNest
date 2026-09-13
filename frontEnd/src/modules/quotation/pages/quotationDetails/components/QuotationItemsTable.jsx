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
              const quantity = Math.max(1, Number(item.quantity) || 1);

              const unitPrice = Math.max(0, Number(item.unitPrice) || 0);

              const discountAmount = Math.max(
                0,
                Number(item.discountAmount) || 0,
              );

              const gstRate = Math.min(
                100,
                Math.max(0, Number(item.gstRate ?? 18)),
              );

              const subtotal = quantity * unitPrice;

              const discount = Math.min(discountAmount, subtotal);

              const taxableAmount = subtotal - discount;

              const gstAmount = taxableAmount * (gstRate / 100);

              const lineTotal = taxableAmount + gstAmount;

              return (
                <tr
                  key={`${item.productId}-${index}`}
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
                    {quantity}
                  </td>

                  <td className="px-3 py-4 text-right text-sm text-text">
                    {formatCurrency(unitPrice)}
                  </td>

                  <td className="px-3 py-4 text-right text-sm text-text">
                    {formatCurrency(discount)}
                  </td>

                  <td className="px-3 py-4 text-right text-sm text-text">
                    {gstRate}%
                  </td>

                  <td className="px-4 py-4 text-right text-sm font-semibold text-text">
                    {formatCurrency(lineTotal)}
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
