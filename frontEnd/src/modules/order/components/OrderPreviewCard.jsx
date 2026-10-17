import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import OrderActions from "./OrderActions";
import { formatOrderDate, formatOrderMoney, orderStatusLabel, orderSourceNumber, orderQuotationId } from "../order.util";

const OrderPreviewCard = ({ order, downloadOrder, removeOrder, updateStatus, disabled, showDetailsLink = true }) => {
  const { user } = useAuth();
  const quotationId = orderQuotationId(order);
  const customer = order.customerSnapshot || {};
  const totals = [["Subtotal", order.subtotal], ["Discount", order.discountAmount], ["Taxable amount", order.taxableAmount], ["GST", order.gstAmount], ["Grand total", order.totalSnapshot]];
  const dates = [["Created", order.createdAt], ["Confirmed", order.confirmedAt], ["Dispatch due", order.dispatchDate], ["Dispatched", order.dispatchedDate], ["Delivered", order.deliveredAt], ["Closed", order.closedAt], ["Cancelled", order.cancelledAt]];
  return (
    <section aria-label="Order information" className="min-w-0 flex-1 space-y-6 rounded-2xl bg-card-bg p-6 text-text shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{order.orderId}</h2>
        <span className="rounded-xl bg-bg px-3 py-1">{orderStatusLabel(order.status)}</span>
      </div>
      {showDetailsLink && <Link to={`/admin/orders/${encodeURIComponent(order.orderId)}`} className="inline-block underline">Open Order Details</Link>}
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div><dt className="text-secondary-text">Source quotation</dt><dd>{quotationId ? <Link to={`/admin/quotations/${quotationId}`} className="underline">{orderSourceNumber(order)}</Link> : orderSourceNumber(order)}</dd></div>
        <div><dt className="text-secondary-text">Order source</dt><dd>{order.sourceType === "quotation_conversion" ? "Approved quotation conversion" : "Legacy order"}</dd></div>
        <div><dt className="text-secondary-text">Created by</dt><dd>{order.addedBy?.name || "Unavailable"}{order.addedBy?.empId ? ` (${order.addedBy.empId})` : ""}</dd></div>
        {order.statusUpdatedAt && <div><dt className="text-secondary-text">Status updated</dt><dd>{formatOrderDate(order.statusUpdatedAt)}{order.statusUpdatedBy?.name ? ` · ${order.statusUpdatedBy.name}` : ""}</dd></div>}
        {dates.filter(([label, date]) => label === "Created" || date).map(([label, date]) => <div key={label}><dt className="text-secondary-text">{label}</dt><dd>{formatOrderDate(date)}</dd></div>)}
      </dl>
      <div>
        <h3 className="mb-2 font-semibold">Customer at order creation</h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {[["Name", customer.name], ["Customer number", customer.customerId], ["Company type", customer.companyType], ["Contact", customer.contact], ["Email", customer.email], ["GST", customer.gst], ["Address", customer.address]].map(([label, value]) => <div key={label}><dt className="text-secondary-text">{label}</dt><dd className="whitespace-pre-wrap break-words">{typeof value === "string" && value.trim() ? value : "Unavailable"}</dd></div>)}
        </dl>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Order items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr>{["Product", "Quantity", "Unit price", "Discount", "GST", "Taxable", "Line total"].map(label => <th key={label} className="whitespace-nowrap border-b border-border-color p-2">{label}</th>)}</tr></thead>
            <tbody>{order.productsSnapshot?.map((item, index) => <tr key={item._id || index}>
              <td className="min-w-32 p-2"><p>{item.name || "Unavailable"}</p>{item.sku && <p className="text-xs text-secondary-text">{item.sku}</p>}{item.description && <p className="text-xs text-secondary-text">{item.description}</p>}</td>
              <td className="p-2">{item.quantity ?? "Unavailable"}</td>
              <td className="whitespace-nowrap p-2">{formatOrderMoney(item.unitPrice ?? item.price)}</td>
              <td className="whitespace-nowrap p-2">{formatOrderMoney(item.discountAmount)}{typeof item.discountPercentage === "number" ? ` (${item.discountPercentage}%)` : ""}</td>
              <td className="whitespace-nowrap p-2">{formatOrderMoney(item.gstAmount)}{typeof item.gstRate === "number" ? ` (${item.gstRate}%)` : ""}</td>
              <td className="whitespace-nowrap p-2">{formatOrderMoney(item.taxableAmount)}</td>
              <td className="whitespace-nowrap p-2">{formatOrderMoney(item.lineTotal)}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {!order.productsSnapshot?.length && <p className="text-sm text-secondary-text">Historical item details are unavailable.</p>}
        {order.sourceType !== "quotation_conversion" && <p className="mt-3 text-sm text-secondary-text">Unavailable amounts were not recorded in this legacy order. Historical pricing has not been recalculated.</p>}
      </div>
      <dl className="ml-auto max-w-sm space-y-2 border-t border-border-color pt-4 text-sm">
        {totals.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt>{label}</dt><dd>{formatOrderMoney(value)}</dd></div>)}
      </dl>
      {order.cancellationReason && <div className="rounded-xl border border-border-color p-4"><h3 className="font-semibold">Cancellation</h3><p className="whitespace-pre-wrap">{order.cancellationReason}</p><p className="text-sm text-secondary-text">{order.cancelledBy?.name || "Reviewer unavailable"} · {formatOrderDate(order.cancelledAt)}</p></div>}
      <OrderActions order={order} user={user} disabled={disabled} updateStatus={updateStatus} removeOrder={removeOrder} downloadOrder={downloadOrder} />
    </section>
  );
};
export default OrderPreviewCard;
