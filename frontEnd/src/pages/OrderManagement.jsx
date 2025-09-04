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
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const OrderManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orders, setOrders] = useState([]);
  const [ActiveOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/orders`);
      setOrders(res.data);
      console.log("orders being fetched", res.data);
    } catch (err) {
      console.error("Error in fetching the orders from the server", err);
    }
  };

  const handleDeleteOrder = async (e, order) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("deleting order", order);
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
        <div className=" w-full mt-16 px-10 flex">
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
        <div className="flex justify-between">
          <div className="h-120 mt-16 flex flex-col overflow-auto px-4 pb-4 ml-8">
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
              downloadOrder={null}
              editOrder={null}
              delteOrder={null}
              updateStatus={(e)=>updateOrderStatus(e, ActiveOrder)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
