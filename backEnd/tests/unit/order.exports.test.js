const PDFDocument = require("pdfkit");
const generatePdf = require("../../src/utils/pdf/orderPdfGenerator");
const generateCsv = require("../../src/utils/csv/orderCsvGenerator");

const converted = () => ({
  orderId: "ORD004", quotationNumber: "QT-004", status: "confirm",
  addedBy: { name: "Administrator" }, createdAt: "2026-10-17T01:00:00.000Z",
  customerSnapshot: { customerId: "C001", name: 'Frozen, "Customer"', address: "One\nTwo", email: "stored@example.test" },
  productsSnapshot: [{ name: "Frozen Product", productId: "PR001", quantity: 2, unitPrice: 10.05, price: 10.05, discountPercentage: 10, discountAmount: 2.01, gstRate: 0, taxableAmount: 18.09, gstAmount: 0, lineTotal: 18.09 }],
  subtotal: 20.1, discountAmount: 2.01, taxableAmount: 18.09, gstAmount: 0, grandTotal: 18.09, totalSnapshot: 18.09,
  quotationId: { quotationId: "LIVE-ID", products: [{ name: "Changed Live Product", quantity: 99, price: 999 }], total: 99999, customerId: { name: "Changed Customer" } },
});

describe("Order exports use stored commercial values", () => {
  test("CSV preserves values, explicit zero GST, and escapes customer text", () => {
    const csv = generateCsv(converted());
    expect(csv).toContain('Name,"Frozen, ""Customer"""');
    expect(csv).toContain('Address,"One\nTwo"');
    expect(csv).toContain("Frozen Product,PR001,2,10.05,10,2.01,0,18.09,0,18.09");
    expect(csv).toContain("Grand Total (INR),18.09");
    expect(csv).toContain("Quotation ID,QT-004");
    expect(csv).not.toMatch(/Changed|LIVE-ID|99999|undefined|NaN|Invalid Date/);
  });

  test("CSV treats spreadsheet formulas as text", () => {
    const order = converted();
    order.customerSnapshot.name = "  =1+1";
    order.productsSnapshot[0].name = '@SUM(1,2)';
    expect(generateCsv(order)).toContain("Name,'  =1+1");
    expect(generateCsv(order)).toContain('"\'@SUM(1,2)"');
  });

  test("legacy unknown amounts stay unavailable, while known prices and total remain", () => {
    const csv = generateCsv({ orderId: "ORD001", status: "delivered", totalSnapshot: 125, productsSnapshot: [{ name: "Legacy", price: 25, quantity: 5 }], customerSnapshot: { name: "Legacy Customer" } });
    expect(csv).toContain("Legacy,Unavailable,5,25,Unavailable,Unavailable,Unavailable,Unavailable,Unavailable,Unavailable");
    expect(csv).toContain("GST (INR),Unavailable");
    expect(csv).toContain("Grand Total (INR),125");
    expect(csv).toContain("Quotation ID,Unavailable");
    expect(csv).not.toMatch(/undefined|NaN|Invalid Date/);
  });

  test("real PDF is complete and uses frozen snapshots", async () => {
    const text = jest.spyOn(PDFDocument.prototype, "text");
    try {
      const pdf = await generatePdf(converted());
      expect(Buffer.isBuffer(pdf)).toBe(true);
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
      expect(pdf.subarray(-100).toString()).toContain("%%EOF");
      const written = text.mock.calls.map(([line]) => line).join("\n");
      expect(written).toContain("Frozen Product | PR001 | 2 | 10.05 | 10 | 2.01 | 0 | 18.09 | 0 | 18.09");
      expect(written).toContain('Name | Frozen, "Customer"');
      expect(written).toContain("Grand Total (INR) | 18.09");
      expect(written).not.toMatch(/Changed|LIVE-ID|99999|undefined|NaN/);
    } finally { text.mockRestore(); }
  });

  test("missing Order fails explicitly", async () => {
    expect(() => generateCsv(null)).toThrow("Order not found");
    await expect(generatePdf(null)).rejects.toMatchObject({ statusCode: 404 });
  });
});
