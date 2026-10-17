// Missing legacy components cannot be reconstructed from current products.
const value = (input) => input === undefined || input === null || input === ""
  ? "Unavailable" : String(input);
const date = (input) => {
  if (!input) return "Unavailable";
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? "Unavailable" : parsed.toISOString();
};

module.exports = (order) => {
  const customer = order.customerSnapshot || {};
  return [
    ["Order ID", value(order.orderId)],
    ["Quotation ID", value(order.quotationNumber || order.quotationId?.quotationId)],
    ["Status", value(order.status)],
    ["Created", date(order.createdAt)],
    ["Added By", value(order.addedBy?.name)],
    [],
    ["Customer Details (stored snapshot)"],
    ["Customer ID", value(customer.customerId)],
    ["Name", value(customer.name)],
    ["Address", value(customer.address)],
    ["Contact", value(customer.contact)],
    ["Email", value(customer.email)],
    ["GST", value(customer.gst)],
    [],
    ["Products (stored snapshots; amounts in INR)"],
    ["Name", "Product Code", "Quantity", "Unit Price", "Discount %", "Discount Amount", "GST %", "Taxable Amount", "GST Amount", "Line Total"],
    ...(order.productsSnapshot || []).map((item) => [
      value(item.name), value(item.productId), value(item.quantity),
      value(item.unitPrice ?? item.price), value(item.discountPercentage),
      value(item.discountAmount), value(item.gstRate), value(item.taxableAmount),
      value(item.gstAmount), value(item.lineTotal),
    ]),
    [],
    ["Subtotal (INR)", value(order.subtotal)],
    ["Discount (INR)", value(order.discountAmount)],
    ["Taxable Amount (INR)", value(order.taxableAmount)],
    ["GST (INR)", value(order.gstAmount)],
    ["Grand Total (INR)", value(order.grandTotal ?? order.totalSnapshot)],
    [],
    ["Fulfillment"],
    ["Confirmed", date(order.confirmedAt)],
    ["Planned Dispatch", date(order.dispatchDate)],
    ["Dispatched", date(order.dispatchedDate)],
    ["Delivered", date(order.deliveredAt)],
    ["Closed", date(order.closedAt)],
    ["Cancelled", date(order.cancelledAt)],
    ["Cancellation Reason", value(order.cancellationReason)],
  ];
};
