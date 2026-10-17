import { Link } from "react-router-dom";
import { formatOrderDate, formatOrderMoney, orderStatusLabel, orderSourceNumber } from "../order.util";

const OrderCard = ({ order, onOrderClick, selected }) => (
  <article className={`my-2 rounded-2xl border bg-card-bg p-5 text-text ${selected ? "border-cta" : "border-border-color"}`}>
    <div className="flex items-start justify-between gap-3">
      <button type="button" onClick={onOrderClick} className="text-left text-lg font-bold underline">{order.orderId}</button>
      <span className="rounded-xl bg-bg px-3 py-1 text-sm">{orderStatusLabel(order.status)}</span>
    </div>
    <p className="mt-2">{order.customerSnapshot?.name || "Customer unavailable"}</p>
    <p className="text-sm text-secondary-text">Quotation: {orderSourceNumber(order)}</p>
    <p className="text-sm text-secondary-text">Created: {formatOrderDate(order.createdAt)}</p>
    <p className="my-3 font-semibold">Total: {formatOrderMoney(order.totalSnapshot)}</p>
    <Link to={`/admin/orders/${encodeURIComponent(order.orderId)}`} className="text-sm underline">Open Order Details</Link>
  </article>
);
export default OrderCard;
