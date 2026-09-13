import { formatCurrency } from "../../../quotation.util";

const QuotationSummary = ({ totals }) => {
  return (
    <div className="mt-8 flex justify-end">
      <div className="w-full max-w-sm space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>

          <span className="font-medium text-text">
            {formatCurrency(totals.subtotal)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Discount</span>

          <span className="font-medium text-red">
            - {formatCurrency(totals.discountAmount)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">GST</span>

          <span className="font-medium text-text">
            {formatCurrency(totals.gstAmount)}
          </span>
        </div>

        <div className="border-t border-border-color pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-base font-bold text-text">Grand Total</span>

            <span className="text-xl font-bold text-text">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationSummary;
