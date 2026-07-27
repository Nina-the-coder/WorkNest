// modules/order/hooks/useOrders.js
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getOrdersAPI,
  deleteOrderAPI,
  updateOrderStatusAPI,
  downloadOrderAPI,
} from "../services/order.api";

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getOrdersAPI();
      setOrders(res.data);
    } catch (err) {
      toast.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const removeOrder = async (order) => {
    if (!window.confirm(`Delete order ${order.orderId}?`)) return;

    await deleteOrderAPI(order.orderId);

    setOrders((prev) =>
      prev.filter((o) => o.orderId !== order.orderId)
    );

    if (activeOrder?.orderId === order.orderId) {
      setActiveOrder(null);
    }

    toast.success("Order deleted successfully");
  };

  const updateStatus = async (order, status) => {
    await updateOrderStatusAPI(order.orderId, status);

    setOrders((prev) =>
      prev.map((o) =>
        o.orderId === order.orderId
          ? { ...o, status }
          : o
      )
    );

    if (activeOrder?.orderId === order.orderId) {
      setActiveOrder({ ...activeOrder, status });
    }

    toast.success("Order status updated");
  };

  const downloadOrder = async (order, type) => {
    const res = await downloadOrderAPI(order.orderId, type);

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
  };

  return {
    orders,
    activeOrder,
    setActiveOrder,
    loading,
    removeOrder,
    updateStatus,
    downloadOrder,
  };
};