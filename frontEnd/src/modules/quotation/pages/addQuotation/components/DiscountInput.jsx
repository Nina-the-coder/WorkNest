const DiscountInput = ({ item, mode, onModeChange, onChange, subtotal }) => {
  const percentage = mode === "percentage";
  return (
    <div className="flex h-10 min-w-0 items-center overflow-hidden rounded-lg border border-border-color bg-bg text-sm text-text transition focus-within:border-cta focus-within:ring-2 focus-within:ring-cta/10">
      <select
        aria-label={`Discount type for ${item.productName}`}
        title="Changing the discount type resets its value."
        value={mode}
        onChange={(event) => onModeChange(event.target.value)}
        className="h-full w-12 shrink-0 border-r border-border-color bg-transparent pl-2 outline-none"
      >
        <option value="amount">₹</option>
        <option value="percentage">%</option>
      </select>
      <input
        className="h-full min-w-0 w-full bg-transparent px-2 text-sm outline-none"
        type="number"
        min="0"
        max={percentage ? 100 : subtotal}
        step={percentage ? "any" : "0.01"}
        aria-label={`${percentage ? "Discount percentage" : "Discount"} for ${item.productName}`}
        value={(percentage ? item.discountPercentage : item.discountAmount) ?? 0}
        onChange={(event) => onChange(percentage ? "discountPercentage" : "discountAmount", event.target.value)}
      />
    </div>
  );
};

export default DiscountInput;
