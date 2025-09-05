import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import CTAButton from "../components/buttons/CTAButton";
import OrderCard from "../components/cards/OrderCard";
import OrderPreviewCard from "../components/cards/OrderPreviewCard";
import { toast } from "react-toastify";
import SkeletonLoader from "../components/SkeletonLoader";
import NoItemFoundModal from "../components/NoItemFoundModal";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const OrderManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orders, setOrders] = useState([]);
  const [ActiveOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/orders`);
      setOrders(res.data);
      console.log("orders being fetched", res.data);
    } catch (err) {
      console.error("Error in fetching the orders from the server", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (e, order) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `Are you sure you want to delete order ${order.orderId}?`
    );
    if (!confirmDelete) return;
    console.log("deleting order", order);
    try {
      await axios.delete(`${BASE_URL}/api/admin/orders/${order.orderId}`);
      setOrders((prev) => prev.filter((o) => o.orderId !== order.orderId));
      if (ActiveOrder && ActiveOrder.orderId === order.orderId) {
        setActiveOrder(null);
      }
      toast.success("Order deleted successfully");
    } catch (err) {
      toast.error("Error in deleting the order");
      console.error("Error in deleting the order", err);
    }
  };

  const updateOrderStatus = async (e, order) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = e.target.value;
    console.log("updating order status", order, newStatus);
    try {
      await axios.put(`${BASE_URL}/api/admin/orders/${order.orderId}`, {
        status: newStatus,
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.orderId === order.orderId ? { ...o, status: newStatus } : o
        )
      );
      if (ActiveOrder && ActiveOrder.orderId === order.orderId) {
        setActiveOrder({ ...ActiveOrder, status: newStatus });
      }
      toast.success("Order status updated successfully");
    } catch (err) {
      toast.error("Error in updating the order status");
      console.error("Error in updating the order status", err);
    }
  };

  const downloadOrder = async (order, type = "pdf") => {
    try {
      const endpoint =
        type === "csv"
          ? `${BASE_URL}/api/admin/orders/${order.orderId}/download-csv`
          : `${BASE_URL}/api/admin/orders/${order.orderId}/download`;

      const res = await axios.get(endpoint, { responseType: "blob" });

      // Create blob and trigger download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `order-${order.orderId}.${type === "csv" ? "csv" : "pdf"}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading order", err);
    }
  };

  const handleActiveOrderChange = (order) => {
    setActiveOrder(order);
    console.log("Active order changed to:", order);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.addedBy?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.addedBy?.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.quotationId?.quotationId
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col bg-bg">
        {/* header */}
        <Header title="Order Management" />

        {/* Search Bar and CTA button */}
        <div className=" w-full mt-14 px-10 flex">
          <div className="flex gap-4">
            <SearchBar
              placeholder="Search for a Quotation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="confirm">confirm</option>
              <option value="dispatched">dispatched</option>
              <option value="delivered">delivered</option>
              <option value="closed">closed</option>
            </FilterDropdown>
          </div>
        </div>

        {/* container */}
        {loading ? (
          <div className="w-full p-4 gap-4">
            <SkeletonLoader count={6} className="flex flex-wrap gap-4" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <NoItemFoundModal message="No orders found" />
        ) : (
          <div className="flex justify-between">
            <div className="h-[500px] mt-14 flex flex-col overflow-auto px-4 pb-4 ml-8">
              {/* cards */}
              {filteredOrders.map((order) => (
                <OrderCard
                  onOrderClick={() => handleActiveOrderChange(order)}
                  key={order._id}
                  order={order}
                  deleteOrder={(e) => handleDeleteOrder(e, order)}
                />
              ))}
            </div>
            {ActiveOrder === null ? (
              <div className="flex items-center justify-center h-120 mt-16 w-[450px] mr-16 text-text text-[18px] font-bold">
                Select an order to preview
              </div>
            ) : (
              <OrderPreviewCard
                order={ActiveOrder}
                downloadOrder={() => downloadOrder(ActiveOrder, "pdf")}
                editOrder={null}
                delteOrder={(e) => handleDeleteOrder(e, ActiveOrder)}
                updateStatus={(e) => updateOrderStatus(e, ActiveOrder)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
