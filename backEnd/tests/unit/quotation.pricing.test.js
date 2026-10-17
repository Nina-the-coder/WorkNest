const { normalizeItemPricing, calculateLineTotal, calculateQuotationTotals, calculateStoredQuotationTotals } = require("../../src/modules/quotation/quotation.pricing");
const AppError = require("../../src/utils/AppError");
const base = { quantity: 1, unitPrice: 100 };

describe("exact quotation commercial pricing", () => {
  test("omitted new GST defaults to 18, while explicit zero stays zero", () => {
    expect(normalizeItemPricing(base)).toEqual({ quantity: 1, unitPrice: 100, discountPercentage: 0, discountAmount: 0, gstRate: 18, taxableAmount: 100, gstAmount: 18, lineTotal: 118 });
    expect(normalizeItemPricing({ ...base, gstRate: 0 }).lineTotal).toBe(100);
    expect(normalizeItemPricing(base, { defaultGstRate: 0 }).gstRate).toBe(0);
  });
  test("small-line half-up stages reconcile line and header", () => {
    const item = { quantity: 1, unitPrice: 0.05, discountPercentage: 10, gstRate: 18 };
    expect(calculateLineTotal(item)).toEqual({ discountAmount: 0.01, taxableAmount: 0.04, gstAmount: 0.01, lineTotal: 0.05 });
    expect(calculateQuotationTotals([item])).toEqual({ subtotal: 0.05, discountAmount: 0.01, taxableAmount: 0.04, gstAmount: 0.01, grandTotal: 0.05 });
    expect(calculateQuotationTotals([item, item, item])).toEqual({ subtotal: 0.15, discountAmount: 0.03, taxableAmount: 0.12, gstAmount: 0.03, grandTotal: 0.15 });
  });
  test("unit-price half-up precedes multiplication and effective amount discount precedes GST", () => {
    expect(normalizeItemPricing({ quantity: 3, unitPrice: "1.005", gstRate: 0 })).toMatchObject({ unitPrice: 1.01, taxableAmount: 3.03, lineTotal: 3.03 });
    expect(normalizeItemPricing({ ...base, discountAmount: "1.005" })).toMatchObject({ discountAmount: 1.01, taxableAmount: 98.99, gstAmount: 17.82, lineTotal: 116.81 });
    expect(normalizeItemPricing({ quantity: 3, unitPrice: 2.675 })).toMatchObject({ unitPrice: 2.68, taxableAmount: 8.04, gstAmount: 1.45, lineTotal: 9.49 });
  });
  test("positive percentage takes precedence over a valid but unused amount", () => {
    expect(normalizeItemPricing({ ...base, discountAmount: 1000, discountPercentage: 10 })).toMatchObject({ discountPercentage: 10, discountAmount: 10, taxableAmount: 90, gstAmount: 16.2, lineTotal: 106.2 });
  });
  test("rates keep Number storage precision without a two-decimal restriction", () => {
    expect(normalizeItemPricing({ ...base, gstRate: "12.34567890123456789" })).toMatchObject({ gstRate: 12.345678901234567, gstAmount: 12.35 });
    expect(normalizeItemPricing({ ...base, discountPercentage: "0.005" }).discountAmount).toBe(0.01);
    const item = normalizeItemPricing({ ...base, gstRate: "12.344999999999999999", discountPercentage: "0.0000000000000000000001" });
    expect(item.gstRate).toBe(12.345);
    expect(normalizeItemPricing(item)).toEqual(item);
  });
  test("numeric scientific notation and tiny exponents work without enormous power allocation", () => {
    expect(normalizeItemPricing({ quantity: "1e2", unitPrice: "1e-2", gstRate: "1.8e1" }).lineTotal).toBe(1.18);
    expect(normalizeItemPricing({ ...base, gstRate: "1e-99999999999999999999999" }).gstAmount).toBe(0);
    expect(normalizeItemPricing({ ...base, unitPrice: "1e-99999999999999999999999" }).lineTotal).toBe(0);
  });
  test("explicit zero price, free item and 100% discount are valid", () => {
    expect(normalizeItemPricing({ ...base, unitPrice: 0 }).lineTotal).toBe(0);
    expect(normalizeItemPricing({ ...base, discountPercentage: 100 }).lineTotal).toBe(0);
  });
  test.each(["unitPrice", "discountAmount", "discountPercentage", "gstRate"])("%s rejects wrong numeric types, nonfinite values and nondecimal/negative input", field => {
    for (const invalid of [null, true, false, "", "  ", Infinity, NaN, "Infinity", "0x12", "-0.01", [], {}]) {
      expect(() => normalizeItemPricing({ ...base, [field]: invalid })).toThrow(AppError);
      try { normalizeItemPricing({ ...base, [field]: invalid }); } catch (error) { expect(error.statusCode).toBe(400); }
    }
  });
  test("price is required rather than defaulting missing/null price to zero", () => {
    expect(() => normalizeItemPricing({ quantity: 1 })).toThrow(/unitPrice/);
    expect(() => normalizeItemPricing({ quantity: 1, unitPrice: undefined })).toThrow(/unitPrice/);
  });
  test.each([0, -1, 1.5, true, null, "", "1.00000000000000000001", Number.MAX_SAFE_INTEGER + 1])("quantity %p is rejected", quantity => {
    expect(() => normalizeItemPricing({ ...base, quantity })).toThrow(/quantity/);
  });
  test.each(["gstRate", "discountPercentage"])("%s exact range rejects fractional values above 100 before Number canonicalization", field => {
    expect(() => normalizeItemPricing({ ...base, [field]: "100.00000000000000000001" })).toThrow(/between 0 and 100/);
  });
  test("effective excess discount is rejected, and malformed unused amount remains invalid", () => {
    expect(() => normalizeItemPricing({ ...base, discountAmount: 100.01 })).toThrow(/exceeds subtotal/);
    expect(() => normalizeItemPricing({ ...base, discountPercentage: 10, discountAmount: null })).toThrow(/discountAmount/);
  });
  test("unsafe cents, multiplication, aggregate sums and JSON cent loss fail explicitly", () => {
    expect(() => normalizeItemPricing({ quantity: Number.MAX_SAFE_INTEGER, unitPrice: 1 })).toThrow(/safe cent range/);
    expect(() => normalizeItemPricing({ ...base, unitPrice: "90071992547409.91", gstRate: 0 })).toThrow(/preserve cents/);
    expect(() => calculateQuotationTotals([{ ...base, unitPrice: 60000000000000, gstRate: 0 }, { ...base, unitPrice: 60000000000000, gstRate: 0 }])).toThrow(/safe cent range/);
  });
  test("empty totals are available for form composition; non-array input is invalid", () => {
    expect(calculateQuotationTotals([])).toEqual({ subtotal: 0, discountAmount: 0, taxableAmount: 0, gstAmount: 0, grandTotal: 0 });
    expect(() => calculateQuotationTotals(null)).toThrow(/items/);
  });
  test("historical totals sum saved components without silently recalculating an inconsistent old line", () => {
    const historical = { quantity: 1, unitPrice: 0.05, discountPercentage: 10, gstRate: 18, discountAmount: 0.01, taxableAmount: 0.05, gstAmount: 0.01, lineTotal: 0.05 };
    expect(calculateStoredQuotationTotals([historical])).toEqual({ subtotal: 0.06, discountAmount: 0.01, taxableAmount: 0.05, gstAmount: 0.01, grandTotal: 0.05 });
    expect(calculateStoredQuotationTotals([historical, historical, historical])).toEqual({ subtotal: 0.18, discountAmount: 0.03, taxableAmount: 0.15, gstAmount: 0.03, grandTotal: 0.15 });
    expect(historical.taxableAmount).toBe(0.05);
    expect(historical.unitPrice).toBe(0.05);
  });
  test("stored total aggregation rejects missing values and unsafe sums", () => {
    expect(() => calculateStoredQuotationTotals([{ discountAmount: 0, taxableAmount: 1, gstAmount: 0 }])).toThrow(/lineTotal/);
    const item = { discountAmount: 0, taxableAmount: 60000000000000, gstAmount: 0, lineTotal: 60000000000000 };
    expect(() => calculateStoredQuotationTotals([item, item])).toThrow(/safe cent range/);
  });
});
