export const ORDER_STATUS_LABELS = {
  pending: "Pending", confirm: "Confirmed", dispatched: "Dispatched",
  delivered: "Delivered", closed: "Closed", cancelled: "Cancelled",
};

export const orderStatusLabel = (status) => ORDER_STATUS_LABELS[status] || status || "Unavailable";
export const formatOrderMoney = (value) => typeof value === "number" && Number.isFinite(value)
  ? `₹${value.toFixed(2)}` : "Unavailable";
export const formatOrderDate = (value) => {
  if (!value) return "Unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
export const canManageOrder = (user, permission) => user?.role === "admin" && user.permissions?.includes(permission);
export const orderSourceNumber = (order) => order.quotationNumber || order.quotationId?.quotationId || "Unavailable";
export const orderQuotationId = (order) => order.quotationId?._id || (typeof order.quotationId === "string" ? order.quotationId : null);
