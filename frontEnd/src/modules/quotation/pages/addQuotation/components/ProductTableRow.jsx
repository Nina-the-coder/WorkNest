import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { formatCurrency } from "../../../quotation.util";

const numberInputClass =
  "w-full rounded-lg border border-border-color bg-bg px-2.5 py-2 text-sm text-text outline-none transition focus:border-cta focus:ring-2 focus:ring-cta/10";

const ProductTableRow = ({ item, index, updateItem, removeItem }) => {
  const quantity = Math.max(1, Number(item.quantity) || 1);

  const unitPrice = Math.max(0, Number(item.unitPrice) || 0);

  const discountAmount = Math.max(0, Number(item.discountAmount) || 0);

  const gstRate = Math.min(100, Math.max(0, Number(item.gstRate ?? 18)));

  const subtotal = quantity * unitPrice;

  const discount = Math.min(discountAmount, subtotal);

  const taxableAmount = subtotal - discount;

  const gstAmount = taxableAmount * (gstRate / 100);

  const lineTotal = taxableAmount + gstAmount;

  return (
    <tr className="border-t border-border-color">
      {/* Product */}
      <td className="px-4 py-4">
        <div className="min-w-[180px]">
          <p className="font-medium text-text">{item.productName}</p>

          <p className="mt-1 text-xs text-gray-500">
            Product #{String(item.productId?._id || item.productId).slice(-6)}
          </p>
        </div>
      </td>

      {/* Unit Price */}
      <td className="px-3 py-4">
        <div className="w-28">
          <input
            className={numberInputClass}
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
          />
        </div>
      </td>

      {/* Quantity */}
      <td className="px-3 py-4">
        <div className="flex w-24 items-center rounded-lg border border-border-color bg-bg">
          <button
            type="button"
            className="flex h-9 w-8 items-center justify-center text-gray-500 transition hover:text-text"
            onClick={() =>
              updateItem(index, "quantity", Math.max(1, quantity - 1))
            }
          >
            <FiMinus size={13} />
          </button>

          <input
            className="h-9 min-w-0 flex-1 border-x border-border-color bg-transparent text-center text-sm text-text outline-none"
            type="number"
            min="1"
            step="1"
            value={item.quantity}
            onChange={(e) => updateItem(index, "quantity", e.target.value)}
          />

          <button
            type="button"
            className="flex h-9 w-8 items-center justify-center text-gray-500 transition hover:text-text"
            onClick={() => updateItem(index, "quantity", quantity + 1)}
          >
            <FiPlus size={13} />
          </button>
        </div>
      </td>

      {/* Discount */}
      <td className="px-3 py-4">
        <div className="w-24">
          <input
            className={numberInputClass}
            type="number"
            min="0"
            step="0.01"
            max={subtotal}
            value={item.discountAmount ?? 0}
            onChange={(e) =>
              updateItem(
                index,
                "discountAmount",
                Math.min(subtotal, Math.max(0, Number(e.target.value) || 0)),
              )
            }
          />
        </div>
      </td>

      {/* GST */}
      <td className="px-3 py-4">
        <div className="w-20">
          <input
            className={numberInputClass}
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={item.gstRate ?? 18}
            onChange={(e) =>
              updateItem(
                index,
                "gstRate",
                Math.min(100, Math.max(0, Number(e.target.value) || 0)),
              )
            }
          />
        </div>
      </td>

      {/* Total */}
      <td className="whitespace-nowrap px-3 py-4 text-right font-semibold text-text">
        {formatCurrency(lineTotal)}
      </td>

      {/* Remove */}
      <td className="px-4 py-4 text-right">
        <button
          type="button"
          title="Remove product"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red/10 hover:text-red"
          onClick={() => removeItem(index)}
        >
          <FiTrash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

export default ProductTableRow;
