const PDFDocument = require("pdfkit");
const AppError = require("../AppError");
const orderExportRows = require("../orderExportRows");

module.exports = async (order) => {
  if (!order) throw new AppError("Order not found", 404);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    orderExportRows(order).forEach((row, index) => {
      if (!row.length) doc.moveDown();
      else doc.fontSize(index === 0 ? 18 : 10).text(row.join(" | "));
    });
    doc.end();
  });
};
