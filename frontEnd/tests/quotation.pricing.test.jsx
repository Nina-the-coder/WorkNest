/* global test, expect, require */
import { calculateItemPricing, calculateQuotationTotals, getItemPricingPreview, calculateFormQuotationPricing } from "../src/modules/quotation/quotation.util";
const backend = require("../../backEnd/src/modules/quotation/quotation.pricing");
const vectors = [
  [{ quantity: 1, unitPrice: 100 }, { subtotal: 100, discountAmount: 0, taxableAmount: 100, gstAmount: 18, grandTotal: 118 }],
  [{ quantity: 1, unitPrice: 100, gstRate: 0 }, { subtotal: 100, discountAmount: 0, taxableAmount: 100, gstAmount: 0, grandTotal: 100 }],
  [{ quantity: 1, unitPrice: 100, discountPercentage: 10, discountAmount: 1000 }, { subtotal: 100, discountAmount: 10, taxableAmount: 90, gstAmount: 16.2, grandTotal: 106.2 }],
  [{ quantity: 1, unitPrice: 0.05, discountPercentage: 10 }, { subtotal: 0.05, discountAmount: 0.01, taxableAmount: 0.04, gstAmount: 0.01, grandTotal: 0.05 }],
  [{ quantity: 3, unitPrice: "1.005", gstRate: 0 }, { subtotal: 3.03, discountAmount: 0, taxableAmount: 3.03, gstAmount: 0, grandTotal: 3.03 }],
  [{ quantity: 1, unitPrice: 100, discountAmount: "1.005" }, { subtotal: 100, discountAmount: 1.01, taxableAmount: 98.99, gstAmount: 17.82, grandTotal: 116.81 }],
  [{ quantity: 1, unitPrice: 100, gstRate: "12.344999999999999999" }, { subtotal: 100, discountAmount: 0, taxableAmount: 100, gstAmount: 12.35, grandTotal: 112.35 }],
  [{ quantity: "1e2", unitPrice: "1e-2", gstRate: "1.8e1" }, { subtotal: 1, discountAmount: 0, taxableAmount: 1, gstAmount: 0.18, grandTotal: 1.18 }],
];
test.each(vectors)("shared preview and authoritative calculator agree for %p", (item, expected) => {
  expect(calculateQuotationTotals([item])).toEqual(expected);
  expect(backend.calculateQuotationTotals([item])).toEqual(expected);
  const { subtotal, ...pricing } = calculateItemPricing(item);
  expect(pricing).toEqual(backend.normalizeItemPricing(item));
  expect(subtotal).toBe(expected.subtotal);
});
test("aggregates add already-rounded line components", () => {
  const items = Array.from({ length: 3 }, () => ({ quantity: 1, unitPrice: 0.05, discountPercentage: 10, gstRate: 18 }));
  expect(calculateQuotationTotals(items)).toEqual({ subtotal: 0.15, discountAmount: 0.03, taxableAmount: 0.12, gstAmount: 0.03, grandTotal: 0.15 });
  expect(calculateQuotationTotals(items)).toEqual(backend.calculateQuotationTotals(items));
});
test.each(["", null, undefined, true, -1, Infinity])("incomplete/invalid price %p gets an explicit preview error without crashing the form", unitPrice => {
  expect(getItemPricingPreview({ quantity: 1, unitPrice }).error).toMatch(/unitPrice/);
  expect(getItemPricingPreview({ quantity: 1, unitPrice })).not.toHaveProperty("lineTotal");
});
test("normalized high precision rates reproduce the same cents after persistence", () => {
  const first = calculateItemPricing({ quantity: 1, unitPrice: 100, gstRate: "12.344999999999999999", discountPercentage: "0.005000000000000000001" });
  expect(calculateItemPricing(first)).toEqual(first);
  expect(backend.normalizeItemPricing(first)).toMatchObject({ gstAmount: first.gstAmount, discountAmount: first.discountAmount, lineTotal: first.lineTotal });
});


test("an unchanged historical line previews its saved components until a commercial input is deliberately edited", () => {
  const original = { _id: "line", productId: "product", quantity: 1, unitPrice: 0.05, discountPercentage: 10,
    discountAmount: 0.01, gstRate: 18, taxableAmount: 0.05, gstAmount: 0.01, lineTotal: 0.05 };
  const unchanged = { ...original, quantity: "1", unitPrice: "0.05" };
  expect(calculateFormQuotationPricing([unchanged], [original])).toEqual({ subtotal: 0.06, discountAmount: 0.01, taxableAmount: 0.05, gstAmount: 0.01, grandTotal: 0.05 });
  expect(calculateFormQuotationPricing([unchanged], [original])).toEqual(backend.calculateStoredQuotationTotals([original]));
  expect(getItemPricingPreview(unchanged, original)).toMatchObject({ unitPrice: 0.05, taxableAmount: 0.05, lineTotal: 0.05 });
  expect(calculateFormQuotationPricing([{ ...unchanged, quantity: "2" }], [original])).toEqual({ subtotal: 0.1, discountAmount: 0.01, taxableAmount: 0.09, gstAmount: 0.02, grandTotal: 0.11 });
});

test("historical lines cannot bypass raw input validation", () => {
  const original = { _id: "line", productId: "product", quantity: 1, unitPrice: 0.05, discountPercentage: 10,
    discountAmount: 0.01, gstRate: 18, taxableAmount: 0.05, gstAmount: 0.01, lineTotal: 0.05 };
  expect(getItemPricingPreview({ ...original, unitPrice: true }, original).error).toMatch(/unitPrice/);
});

test("a historical positive percentage retains saved components when its inactive amount is omitted or changed", () => {
  const original = { _id: "line", productId: "product", quantity: 1, unitPrice: 0.05, discountPercentage: 10,
    discountAmount: 0.01, gstRate: 18, taxableAmount: 0.05, gstAmount: 0.01, lineTotal: 0.05 };
  const omitted = { ...original };
  delete omitted.discountAmount;
  for (const item of [omitted, { ...original, discountAmount: 1000 }]) {
    expect(calculateFormQuotationPricing([item], [original])).toEqual({ subtotal: 0.06, discountAmount: 0.01, taxableAmount: 0.05, gstAmount: 0.01, grandTotal: 0.05 });
  }
  expect(getItemPricingPreview({ ...original, discountAmount: null }, original).error).toMatch(/discountAmount/);
});

test("zero percentage leaves the amount discount active for historical comparison", () => {
  const original = { _id: "line", productId: "product", quantity: 1, unitPrice: 0.05, discountPercentage: 0,
    discountAmount: 0.01, gstRate: 18, taxableAmount: 0.05, gstAmount: 0.01, lineTotal: 0.05 };
  expect(calculateFormQuotationPricing([{ ...original, discountAmount: 0 }], [original]))
    .toEqual({ subtotal: 0.05, discountAmount: 0, taxableAmount: 0.05, gstAmount: 0.01, grandTotal: 0.06 });
});
