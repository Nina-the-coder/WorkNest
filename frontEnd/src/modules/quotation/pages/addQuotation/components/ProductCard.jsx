import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { formatCurrency, getItemPricingPreview } from "../../../quotation.util";
import DiscountInput from "./DiscountInput";

/* -------------------------------------------------------------------------- */
/* Product Card - Mobile                                                      */
/* -------------------------------------------------------------------------- */

const numberInputClass =
  "w-full rounded-lg border border-border-color bg-bg px-2.5 py-2 text-sm text-text outline-none transition focus:border-cta focus:ring-2 focus:ring-cta/10";

const ProductCard = ({ item, originalItem, index, updateItem, removeItem, discountMode, onDiscountModeChange }) => {
  const quantity = Number(item.quantity) || 1;
  const pricing = getItemPricingPreview(item, originalItem);
  const displayAmount = (field) => pricing.error ? "—" : formatCurrency(pricing[field]);

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="rounded-xl border border-border-color bg-card-bg p-4">
      {/* ------------------------------------------------------------------ */}
      {/* Product Header                                                     */}
      {/* ------------------------------------------------------------------ */}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">
            {item.productName || "Unnamed Product"}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Product #
            {String(item.productId?._id || item.productId || "").slice(-6)}
          </p>
        </div>

        <button
          type="button"
          title="Remove product"
          aria-label={`Remove ${item.productName || "product"}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red/10 hover:text-red"
          onClick={() => removeItem(index)}
        >
          <FiTrash2 size={15} />
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Product Fields                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Unit Price */}
        <label>
          <span className="text-xs font-medium text-gray-500">Unit Price</span>

          <input
            className={`${numberInputClass} mt-1.5`}
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice ?? 0}
            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
          />
        </label>

        {/* Quantity */}
        <label>
          <span className="text-xs font-medium text-gray-500">Quantity</span>

          <div className="mt-1.5 flex items-center rounded-lg border border-border-color bg-card-bg">
            <button
              type="button"
              aria-label="Decrease quantity"
              className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-500 transition hover:text-text"
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
              value={item.quantity ?? 1}
              onChange={(e) => updateItem(index, "quantity", e.target.value)}
            />

            <button
              type="button"
              aria-label="Increase quantity"
              className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-500 transition hover:text-text"
              onClick={() => updateItem(index, "quantity", quantity + 1)}
            >
              <FiPlus size={13} />
            </button>
          </div>
        </label>

        {/* Discount */}
        <div>
          <span className="text-xs font-medium text-gray-500">Discount</span>
          <div className="mt-1.5">
            <DiscountInput item={item} mode={discountMode} subtotal={pricing.subtotal}
              onModeChange={onDiscountModeChange}
              onChange={(field, value) => updateItem(index, field, value)} />
          </div>
        </div>

        {/* GST */}
        <label>
          <span className="text-xs font-medium text-gray-500">GST %</span>

          <input
            className={`${numberInputClass} mt-1.5`}
            type="number"
            min="0"
            max="100"
            step="any"
            value={item.gstRate ?? 18}
            onChange={(e) => updateItem(index, "gstRate", e.target.value)}
          />
        </label>
      </div>

      {pricing.error && <p role="alert" className="mt-3 text-xs text-red">{pricing.error}</p>}

      {/* ------------------------------------------------------------------ */}
      {/* Calculation Summary                                                 */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-4 space-y-2 border-t border-border-color pt-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Subtotal</span>

          <span className="text-gray-600">{displayAmount("subtotal")}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Discount</span>

          <span className="text-red">- {displayAmount("discountAmount")}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">GST ({item.gstRate ?? 18}%)</span>

          <span className="text-gray-600">{displayAmount("gstAmount")}</span>
        </div>

        <div className="flex items-center justify-between border-t border-border-color pt-2">
          <span className="text-xs font-medium text-gray-500">Line Total</span>

          <span className="text-sm font-bold text-text">
            {displayAmount("lineTotal")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
