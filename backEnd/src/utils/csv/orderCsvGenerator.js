module.exports = (order) => {
  const rows = [
    ["Order ID", order.orderId],
    ["Quotation ID", order.quotationId?.quotationId],
    ["Status", order.status],
    [
      "Added By",
      `${order.addedBy?.name || "N/A"} (${order.addedBy?.empId || ""})`,
    ],
    [],
    ["Products"],
    ["Name", "Quantity", "Price", "Total"],
    ...order.quotationId.products.map((p) => [
      p.name,
      p.quantity,
      p.price,
      p.price * p.quantity,
    ]),
    [],
    ["Grand Total", order.quotationId.total],
  ];

  return rows.map((row) => row.join(",")).join("\n");
};