// Exact decimal, nonnegative half-up pricing. Persisted money remains JSON numbers.
const AppError = require("../../utils/AppError");
const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);
const MAX_DIGITS = MAX_CENTS.toString().length;

const fail = (field, reason) => { throw new AppError(`${field}: ${reason}`, 400); };

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

// The subtotal is an internal/header component, not a QuotationItem field.
const normalizeItemPricing = (item, options) => {
  const pricing = lineInternal(item, options).stored;
  delete pricing.subtotal;
  return pricing;
};

const calculateLineTotal = item => {
  const { discountAmount, taxableAmount, gstAmount, lineTotal } = normalizeItemPricing(item);
  return { discountAmount, taxableAmount, gstAmount, lineTotal };
};

const calculateQuotationTotals = items => {
  if (!Array.isArray(items)) fail('items', 'must be an array');
  const lines = items.map(item => lineInternal(item));
  const totals = {};
  for (const key of ['subtotal', 'discountAmount', 'taxableAmount', 'gstAmount', 'lineTotal']) {
    const value = lines.reduce((sum, line) => checked(sum + line.components[key], key), 0n);
    totals[key === 'lineTotal' ? 'grandTotal' : key] = moneyNumber(value, key);
  }
  return totals;
};

// Unchanged historical lines keep their saved commercial components. Do not
// derive them again from current catalog data or a newly rounded unit price.
const calculateStoredQuotationTotals = items => {
  if (!Array.isArray(items)) fail('items', 'must be an array');
  const sums = { subtotal: 0n, discountAmount: 0n, taxableAmount: 0n, gstAmount: 0n, grandTotal: 0n };
  for (const item of items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail('item', 'must be an object');
    const discount = cents(item.discountAmount, 'discountAmount');
    const taxable = cents(item.taxableAmount, 'taxableAmount');
    sums.subtotal = checked(sums.subtotal + discount + taxable, 'subtotal');
    sums.discountAmount = checked(sums.discountAmount + discount, 'discountAmount');
    sums.taxableAmount = checked(sums.taxableAmount + taxable, 'taxableAmount');
    sums.gstAmount = checked(sums.gstAmount + cents(item.gstAmount, 'gstAmount'), 'gstAmount');
    sums.grandTotal = checked(sums.grandTotal + cents(item.lineTotal, 'lineTotal'), 'grandTotal');
  }
  return Object.fromEntries(Object.entries(sums).map(([field, value]) => [field, moneyNumber(value, field)]));
};

module.exports = { normalizeItemPricing, calculateLineTotal, calculateQuotationTotals, calculateStoredQuotationTotals };
