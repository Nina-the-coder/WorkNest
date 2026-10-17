import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import OrderPreviewCard from "../components/OrderPreviewCard";
import { useOrder } from "../hooks/useOrders";

const OrderDetailsContent = ({ orderId }) => {
  const { order, loading, error, refreshOrder, pending, ...actions } = useOrder(orderId);
  const navigate = useNavigate();
  const archiveOrder = async record => {
    if (await actions.removeOrder(record)) navigate("/admin/orders", { replace: true });
  };
  return (
    <div className="min-w-0 pb-8">
      <Header title="Order Details" />
      <div className="my-6 flex items-center justify-between gap-4">
        <Link to="/admin/orders" className="text-text underline">Back to Orders</Link>
        <button type="button" onClick={refreshOrder} disabled={loading || pending}
          className="rounded-xl border border-cta px-4 py-2 text-text disabled:opacity-50">Refresh</button>
      </div>
      {error && <div role="alert" className="mb-5 rounded-xl border border-red p-4 text-text">
        <p>{error.status === 404 ? "Order not found or archived." : error.status === 403 ? "You do not have permission to view this order." : error.message}</p>
        <button type="button" onClick={refreshOrder} disabled={loading || pending} className="mt-2 underline">Retry</button>
      </div>}
      {loading && !order ? <SkeletonLoader count={1} /> : order && <OrderPreviewCard order={order} showDetailsLink={false} disabled={loading || pending} {...actions} removeOrder={archiveOrder} />}
    </div>
  );
};
const OrderDetails = () => {
  const { orderId } = useParams();
  return <OrderDetailsContent key={orderId} orderId={orderId} />;
};
export default OrderDetails;
