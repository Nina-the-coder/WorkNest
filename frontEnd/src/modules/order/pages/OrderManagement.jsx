import { useState } from "react";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import OrderFilters from "../components/OrderFilters";
import OrderList from "../components/OrderList";
import OrderPreviewPanel from "../components/OrderPreviewPanel";
import { useOrders } from "../hooks/useOrders";
import { ORDER_STATUS_LABELS, orderSourceNumber } from "../order.util";

const OrderManagement = () => {
  const { orders, activeOrder, setActiveOrder, loading, error, refreshOrders, pending, ...actions } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const query = searchQuery.trim().toLowerCase();
  const filteredOrders = orders.filter(order => (
    [order.orderId, order.customerSnapshot?.name, orderSourceNumber(order)].some(value => String(value || "").toLowerCase().includes(query)) &&
    (!statusFilter || order.status === statusFilter)
  ));
  const statuses = [...new Set([...Object.keys(ORDER_STATUS_LABELS), ...orders.map(order => order.status).filter(Boolean)])];
  return (
    <div className="flex min-w-0 flex-col pb-8">
      <Header title="Order Management" />
      <div className="my-6 flex flex-wrap items-center justify-between gap-4">
        <OrderFilters searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} statuses={statuses} />
        <button type="button" disabled={loading || pending} onClick={refreshOrders} className="rounded-xl border border-cta px-4 py-2 text-text disabled:opacity-50">Refresh</button>
      </div>
      {error && <div role="alert" className="mb-5 rounded-xl border border-red p-4 text-text">
        <p>{error.status === 403 ? "You do not have permission to view orders." : error.message}</p>
        <button type="button" onClick={refreshOrders} disabled={loading || pending} className="mt-2 underline">Retry</button>
      </div>}
      {loading && orders.length === 0 ? <SkeletonLoader count={6} /> : <div aria-busy={loading || pending}>
        {filteredOrders.length > 0 ? <div className="flex flex-col items-start gap-6 lg:flex-row">
          <OrderList orders={filteredOrders} onSelect={setActiveOrder} activeOrder={activeOrder} />
          <OrderPreviewPanel activeOrder={filteredOrders.some(order => order.orderId === activeOrder?.orderId) ? activeOrder : null} disabled={pending || loading} {...actions} />
        </div> : !loading && !error && <p className="rounded-2xl bg-card-bg p-6 text-secondary-text">{query || statusFilter ? "No orders match your search." : "No orders found. Convert an approved quotation to create an order."}</p>}
      </div>}
    </div>
  );
};
export default OrderManagement;
