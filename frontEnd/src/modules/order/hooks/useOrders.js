import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getOrdersAPI, getOrderAPI, deleteOrderAPI, updateOrderStatusAPI, downloadOrderAPI } from "../services/order.api";

const failureDetails = failure => ({
  status: failure.response?.status,
  message: failure.response?.data?.message || "Unable to load orders. Please try again.",
});
const denied = failure => [401, 403, 404].includes(failure.response?.status);

// The existing preview and deep-linked details share the same API actions.
const useOrderActions = (refresh, setError) => {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const run = async (request, message) => {
    if (pendingRef.current) return false;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    try {
      await request();
      if (!mounted.current) return false;
      if (message) toast.success(message);
      await refresh();
      return true;
    } catch (failure) {
      if (!mounted.current) return false;
      if ([400, 403, 404, 409].includes(failure.response?.status)) await refresh();
      if (mounted.current) setError(failureDetails(failure));
      return false;
    } finally {
      pendingRef.current = false;
      if (mounted.current) setPending(false);
    }
  };
  const removeOrder = order => {
    if (!window.confirm(`Archive order ${order.orderId}?`)) return Promise.resolve(false);
    return run(() => deleteOrderAPI(order.orderId), "Order archived successfully");
  };
  const updateStatus = (order, status, reason) => run(
    () => updateOrderStatusAPI(order.orderId, status, order.status, reason), "Order status updated",
  );
  const downloadOrder = (order, type) => run(async () => {
    const response = await downloadOrderAPI(order.orderId, type);
    const url = window.URL.createObjectURL(response.data instanceof Blob ? response.data : new Blob([response.data]));
    const link = document.createElement("a");
    try {
      link.href = url;
      link.download = `order-${order.orderId}.${type === "csv" ? "csv" : "pdf"}`;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      window.URL.revokeObjectURL(url);
    }
  });
  return { pending, removeOrder, updateStatus, downloadOrder };
};

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const version = useRef(0);
  const refreshOrders = useCallback(async () => {
    const request = ++version.current;
    setLoading(true);
    try {
      const response = await getOrdersAPI();
      if (request !== version.current) return;
      setOrders(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (failure) {
      if (request !== version.current) return;
      if (denied(failure)) setOrders([]);
      setError(failureDetails(failure));
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, []);
  const actions = useOrderActions(refreshOrders, setError);
  useEffect(() => {
    void refreshOrders();
    const focus = () => { if (document.visibilityState !== "hidden") void refreshOrders(); };
    window.addEventListener("focus", focus);
    return () => { version.current += 1; window.removeEventListener("focus", focus); };
  }, [refreshOrders]);
  return {
    orders, activeOrder: orders.find(order => order.orderId === activeId) || null,
    setActiveOrder: order => setActiveId(order?.orderId || null), loading, error, refreshOrders, ...actions,
  };
};

export const useOrder = (orderId) => {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorRecord, setErrorRecord] = useState(null);
  const version = useRef(0);
  const setError = useCallback(error => setErrorRecord({ id: orderId, error }), [orderId]);
  const refreshOrder = useCallback(async () => {
    const request = ++version.current;
    setLoading(true);
    try {
      const response = await getOrderAPI(orderId);
      if (request !== version.current) return;
      setRecord({ id: orderId, order: response.data.order });
      setError(null);
    } catch (failure) {
      if (request !== version.current) return;
      if (denied(failure)) setRecord(null);
      setError(failureDetails(failure));
    } finally {
      if (request === version.current) setLoading(false);
    }
  }, [orderId, setError]);
  const actions = useOrderActions(refreshOrder, setError);
  useEffect(() => {
    void refreshOrder();
    const focus = () => { if (document.visibilityState !== "hidden") void refreshOrder(); };
    window.addEventListener("focus", focus);
    return () => { version.current += 1; window.removeEventListener("focus", focus); };
  }, [refreshOrder]);
  return {
    order: record?.id === orderId ? record.order : null,
    error: errorRecord?.id === orderId ? errorRecord.error : null, loading, refreshOrder, ...actions,
  };
};
