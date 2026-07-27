// modules/order/pages/OrderManagement.jsx
import { useState } from "react";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import NoItemFoundModal from "../../../shared/components/NoItemFoundModal";
import OrderFilters from "../components/OrderFilters";
import OrderList from "../components/OrderList";
import OrderPreviewPanel from "../components/OrderPreviewPanel";
import { useOrders } from "../hooks/useOrders";

const OrderManagement = () => {
  const {
    orders,
    activeOrder,
    setActiveOrder,
    loading,
    removeOrder,
    updateStatus,
    downloadOrder,
  } = useOrders();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.orderId
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter ? order.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col">
      <Header title="Order Management" />

      <div className="flex gap-8 my-10">
        <OrderFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </div>

      {loading ? (
        <SkeletonLoader count={6} />
      ) : filteredOrders.length === 0 ? (
        <NoItemFoundModal message="No orders found" />
      ) : (
        <div className="flex justify-between mt-10">
          <OrderList
            orders={filteredOrders}
            onSelect={setActiveOrder}
            removeOrder={removeOrder}
          />

          <OrderPreviewPanel
            activeOrder={activeOrder}
            updateStatus={updateStatus}
            removeOrder={removeOrder}
            downloadOrder={downloadOrder}
          />
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
