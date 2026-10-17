import { useEffect, useState } from "react";
import { canManageOrder, orderStatusLabel } from "../order.util";

const OrderActions = ({ order, user, disabled, updateStatus, removeOrder, downloadOrder }) => {
  const [nextStatus, setNextStatus] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const allowed = Array.isArray(order.allowedTransitions) ? order.allowedTransitions : [];
  const canUpdate = canManageOrder(user, "ORDER_UPDATE");
  useEffect(() => { setNextStatus(""); setReason(""); setError(""); }, [order.orderId, order.status]);
  const submit = async event => {
    event.preventDefault();
    if (!allowed.includes(nextStatus) || disabled) return;
    if (nextStatus === "cancelled" && !reason.trim()) {
      setError("A cancellation reason is required");
      return;
    }
    setError("");
    await updateStatus(order, nextStatus, nextStatus === "cancelled" ? reason.trim() : undefined);
  };
  return (
    <fieldset disabled={disabled} className="space-y-4 disabled:opacity-60" aria-busy={disabled}>
      {canUpdate && allowed.length > 0 && <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-secondary-text">Next order status
            <select aria-label="Next order status" value={nextStatus} onChange={event => { setNextStatus(event.target.value); setError(""); }}
              className="rounded-xl border border-border-color bg-bg px-3 py-2 text-text">
              <option value="">Choose status</option>
              {allowed.map(status => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}
            </select>
          </label>
          <button type="submit" disabled={disabled || !allowed.includes(nextStatus)}
            className="rounded-xl border border-cta px-4 py-2 text-text disabled:opacity-50">Update status</button>
        </div>
        {nextStatus === "cancelled" && <label className="flex flex-col gap-1 text-sm text-secondary-text">Cancellation reason
          <textarea aria-label="Cancellation reason" value={reason} onChange={event => setReason(event.target.value)}
            className="rounded-xl border border-border-color bg-bg p-3 text-text" />
        </label>}
        {error && <p role="alert" className="text-sm text-red">{error}</p>}
      </form>}
      {canUpdate && allowed.length === 0 && <p className="text-sm text-secondary-text">No further status changes are available.</p>}
      {order.status === "closed" && <p className="text-sm text-secondary-text">Closed records administrative completion. It does not record payment.</p>}
      <div className="flex flex-wrap gap-3">
        {canManageOrder(user, "ORDER_READ") && <>
          <button type="button" onClick={() => downloadOrder(order, "pdf")} className="rounded-xl border border-border-color px-3 py-2 text-sm text-text">Download PDF</button>
          <button type="button" onClick={() => downloadOrder(order, "csv")} className="rounded-xl border border-border-color px-3 py-2 text-sm text-text">Download CSV</button>
        </>}
        {canManageOrder(user, "ORDER_ARCHIVE") && <button type="button" onClick={() => removeOrder(order)}
          className="rounded-xl border border-red px-3 py-2 text-sm text-text">Archive order</button>}
      </div>
    </fieldset>
  );
};

export default OrderActions;
