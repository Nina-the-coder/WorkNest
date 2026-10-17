// Exact decimal, nonnegative half-up pricing. Persisted money remains JSON numbers.
const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_DIGITS = MAX_CENTS.toString().length;

const fail = (field, reason) => { throw new Error(`${field}: ${reason}`); };

const decimal = (value, field) => {
  if (typeof value !== 'number' && typeof value !== 'string') fail(field, 'must be a number');
  const text = String(value).trim();
  if (!text || !Number.isFinite(Number(text))) fail(field, 'must be finite');
  const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(text);
  if (!match) fail(field, 'must be decimal');
  const fraction = match[3] ?? match[4] ?? '';
  let digits = ((match[2] ?? '') + fraction).replace(/^0+/, '') || '0';
  let exponent = BigInt(match[5] ?? '0') - BigInt(fraction.length);
  if (match[1] === '-' && digits !== '0') fail(field, 'must be non-negative');
  if (digits === '0') return { digits, exponent: 0n, value: 0 };
  const significant = digits.replace(/0+$/, '');
  exponent += BigInt(digits.length - significant.length);
  digits = significant;
  return { digits, exponent, value: Number(text) };
};

// Round digits * 10^exponent without allocating powers for hostile exponent strings.
const roundedInteger = (digits, exponent, field) => {
  if (digits === '0') return 0n;
  const cut = BigInt(digits.length) + exponent;
  if (cut < 0n) return 0n;
  if (cut === 0n) return digits[0] >= '5' ? 1n : 0n;
  if (cut > BigInt(MAX_DIGITS)) fail(field, 'exceeds safe cent range');
  const position = Number(cut);
  let integer;
  if (position >= digits.length) {
    integer = BigInt(digits + '0'.repeat(position - digits.length));
  } else {
    integer = BigInt(digits.slice(0, position));
    if (digits[position] >= '5') integer += 1n;
  }
  if (integer > MAX_CENTS) fail(field, 'exceeds safe cent range');
  return integer;
};

const cents = (value, field) => {
  const parsed = decimal(value, field);
  return roundedInteger(parsed.digits, parsed.exponent + 2n, field);
};

const rate = (value, field) => {
  const parsed = decimal(value, field);
  if (parsed.digits === '0') return parsed;
  const decimalPosition = BigInt(parsed.digits.length) + parsed.exponent;
  if (decimalPosition > 3n) fail(field, 'must be between 0 and 100');
  if (decimalPosition === 3n) {
    const whole = parsed.digits.slice(0, 3).padEnd(3, '0');
    if (whole > '100' || (whole === '100' && /[1-9]/.test(parsed.digits.slice(3)))) {
      fail(field, 'must be between 0 and 100');
    }
  }
  // Rates are stored as Number. Canonicalize to that representation before
  // calculation so revalidating returned/stored fields reproduces the same cents.
  return decimal(parsed.value, field);
};

const quantity = value => {
  const parsed = decimal(value, 'quantity');
  if (parsed.digits === '0' || parsed.exponent < 0n) fail('quantity', 'must be a positive integer');
  return roundedInteger(parsed.digits, parsed.exponent, 'quantity');
};

const checked = (value, field) => {
  if (value < 0n || value > MAX_CENTS) fail(field, 'exceeds safe cent range');
  return value;
};

const percentOf = (amount, parsed, field) => roundedInteger(
  (amount * BigInt(parsed.digits)).toString(), parsed.exponent - 2n, field,
);

const moneyNumber = (value, field) => {
  checked(value, field);
  const text = value.toString().padStart(3, '0');
  const numeric = Number(`${text.slice(0, -2)}.${text.slice(-2)}`);
  // Safe integer cents alone do not guarantee JSON major-unit numbers preserve a cent.
  if (cents(numeric, field) !== value) fail(field, 'cannot preserve cents in the existing JSON number format');
  return numeric;
};

const lineInternal = (item, { defaultGstRate = 18 } = {}) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) fail('item', 'must be an object');
  const count = quantity(item.quantity);
  const price = cents(item.unitPrice, 'unitPrice');
  const amount = cents(item.discountAmount === undefined ? 0 : item.discountAmount, 'discountAmount');
  const percentage = rate(item.discountPercentage === undefined ? 0 : item.discountPercentage, 'discountPercentage');
  const gst = rate(item.gstRate === undefined ? defaultGstRate : item.gstRate, 'gstRate');
  const base = checked(count * price, 'subtotal');
  const discount = percentage.digits !== '0' ? percentOf(base, percentage, 'discountAmount') : amount;
  if (discount > base) fail('discountAmount', 'effective discount exceeds subtotal');
  const taxable = base - discount;
  const gstAmount = percentOf(taxable, gst, 'gstAmount');
  const total = checked(taxable + gstAmount, 'lineTotal');
  const components = { subtotal: base, discountAmount: discount, taxableAmount: taxable, gstAmount, lineTotal: total };
  const stored = {
    quantity: Number(count), unitPrice: moneyNumber(price, 'unitPrice'),
    discountPercentage: percentage.value, gstRate: gst.value,
  };
  for (const [key, value] of Object.entries(components)) stored[key] = moneyNumber(value, key);
  return { stored, components };
};

export const calculateItemPricing = item => lineInternal(item).stored;

// A temporarily incomplete number field must not crash a form while typing.
export const getOriginalQuotationItem = (item, originalItems = []) => {
  const id = value => String(value?._id || value).toLowerCase();
  const original = item._id
    ? originalItems.find(existing => id(existing._id) === id(item._id))
    : originalItems.find(existing => id(existing.productId) === id(item.productId));
  return original && id(original.productId) === id(item.productId) ? original : null;
};

const formItemPricing = (item, original) => {
  const current = item.gstRate === undefined && original ? { ...item, gstRate: original.gstRate } : item;
  const pricing = calculateItemPricing(current); // Invalid raw fields never bypass validation.
  const fields = ['quantity', 'unitPrice', 'discountAmount', 'discountPercentage', 'gstRate'];
  const unchanged = original && fields.every(field => {
    // A positive percentage is authoritative; the amount field is inactive.
    if (field === 'discountAmount' && Number(item.discountPercentage) > 0) return true;
    return Number(item[field] === undefined ? field === 'gstRate' ? original.gstRate : 0 : item[field]) === original[field];
  });
  if (!unchanged) return pricing;
  const historical = {};
  for (const field of [...fields, 'taxableAmount', 'gstAmount', 'lineTotal']) historical[field] = original[field];
  historical.subtotal = moneyNumber(checked(cents(original.taxableAmount, 'taxableAmount') +
    cents(original.discountAmount, 'discountAmount'), 'subtotal'), 'subtotal');
  return historical;
};

export const getItemPricingPreview = (item, original) => {
  try { return { ...formItemPricing(item, original), error: null }; }
  catch (error) { return { error: error.message }; }
};

// Form saves keep untouched historical components, matching the backend. Only
// deliberate commercial changes or newly selected products receive new pricing.
export const calculateFormQuotationPricing = (items = [], originalItems = []) => {
  const sums = { subtotal: 0n, discountAmount: 0n, taxableAmount: 0n, gstAmount: 0n, grandTotal: 0n };
  for (const item of items) {
    const pricing = formItemPricing(item, getOriginalQuotationItem(item, originalItems));
    for (const field of Object.keys(sums)) {
      sums[field] = checked(sums[field] + cents(pricing[field === 'grandTotal' ? 'lineTotal' : field], field), field);
    }
  }
  return Object.fromEntries(Object.entries(sums).map(([field, value]) => [field, moneyNumber(value, field)]));
};

export const calculateQuotationTotals = (items = []) => {
  if (!Array.isArray(items)) fail('items', 'must be an array');
  const lines = items.map(item => lineInternal(item));
  const totals = {};
  for (const key of ['subtotal', 'discountAmount', 'taxableAmount', 'gstAmount', 'lineTotal']) {
    const value = lines.reduce((sum, line) => checked(sum + line.components[key], key), 0n);
    totals[key === 'lineTotal' ? 'grandTotal' : key] = moneyNumber(value, key);
  }
  return totals;
};

// Existing positional helpers remain compatible with their callers.
export const calculateLineTotal = (quantity, unitPrice, discountAmount = 0, gstRate = 18) =>
  calculateItemPricing({ quantity, unitPrice, discountAmount, gstRate }).lineTotal;
export const calculateTaxableAmount = (quantity, unitPrice, discountAmount = 0) =>
  calculateItemPricing({ quantity, unitPrice, discountAmount, gstRate: 0 }).taxableAmount;
export const calculateGstAmount = (taxableAmount, gstRate = 18) =>
  calculateItemPricing({ quantity: 1, unitPrice: taxableAmount, gstRate }).gstAmount;

/**
 * Format currency for display
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
};

/**
 * Format date for display
 */
export const formatDate = (date) => {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Get status badge color
 */
export const getStatusBadgeColor = (status) => {
  const statusColorMap = {
    DRAFT: "bg-gray-100 text-gray-800",
    SUBMITTED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CONVERTED: "bg-purple-100 text-purple-800",
  };

  return statusColorMap[status] || "bg-gray-100 text-gray-800";
};

/**
 * Check if quotation can be edited
 */
export const canEditQuotation = (status) => {
  return status === "DRAFT" || status === "REJECTED";
};

/**
 * Check if quotation can be submitted
 */
export const canSubmitQuotation = (status) => {
  return status === "DRAFT";
};

/**
 * Check if quotation can be approved
 */
export const canApproveQuotation = (status) => {
  return status === "SUBMITTED";
};

/**
 * Check if quotation can be rejected
 */
export const canRejectQuotation = (status) => {
  return status === "SUBMITTED";
};

/**
 * Get available actions for quotation based on status and permissions
 */
export const getAvailableActions = (quotation, userPermissions = []) => {
  const actions = [];
  const { status } = quotation;

  if (
    canEditQuotation(status) &&
    userPermissions.includes("QUOTATION_UPDATE")
  ) {
    actions.push({ id: "edit", label: "Edit", type: "primary" });
  }

  if (
    canSubmitQuotation(status) &&
    userPermissions.includes("QUOTATION_SUBMIT")
  ) {
    actions.push({ id: "submit", label: "Submit", type: "success" });
  }

  if (
    canApproveQuotation(status) &&
    userPermissions.includes("QUOTATION_APPROVE")
  ) {
    actions.push({ id: "approve", label: "Approve", type: "success" });
  }

  if (
    canRejectQuotation(status) &&
    userPermissions.includes("QUOTATION_REJECT")
  ) {
    actions.push({ id: "reject", label: "Reject", type: "danger" });
  }

  if (userPermissions.includes("QUOTATION_ARCHIVE")) {
    actions.push({ id: "delete", label: "Delete", type: "danger" });
  }

  return actions;
};
