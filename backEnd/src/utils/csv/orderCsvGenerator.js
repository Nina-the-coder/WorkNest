const AppError = require("../AppError");
const orderExportRows = require("../orderExportRows");

const escapeCell = (input) => {
  let cell = String(input);
  // Keep customer/product text from becoming a spreadsheet formula.
  if (/^\s*[=+@-]/.test(cell)) cell = `'${cell}`;
  return /[",\r\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
};

module.exports = (order) => {
  if (!order) throw new AppError("Order not found", 404);
  return orderExportRows(order).map((row) => row.map(escapeCell).join(",")).join("\r\n");
};
