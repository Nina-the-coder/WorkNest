import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  getCustomersAPI, getCustomerAPI, createCustomerAPI, updateCustomerAPI, deleteCustomerAPI,
} from "../services/customer.api";

const customerError = (failure, fallback) => ({
  status: failure.response?.status,
  message: failure.response?.data?.message || fallback,
});

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const mounted = useRef(true);
  const requestVersion = useRef(0);

  const refreshCustomers = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getCustomersAPI();
      if (version !== requestVersion.current) return false;
      setCustomers(response.data);
      return true;
    } catch (failure) {
      if (version === requestVersion.current) {
        setError(customerError(failure, "Unable to load customers. Please try again."));
        if ([401, 403, 404].includes(failure.response?.status)) setCustomers([]);
      }
      return false;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refreshCustomers();
    const onFocus = () => {
      if (document.visibilityState !== "hidden" && !pendingRef.current) void refreshCustomers();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      requestVersion.current += 1;
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCustomers]);

  const mutate = async (request, message) => {
    if (pendingRef.current) return null;
    pendingRef.current = true;
    setPending(true);
    // Older list reads cannot replace the refresh after this mutation.
    requestVersion.current += 1;
    setLoading(false);
    try {
      const response = await request();
      if (mounted.current) {
        toast.success(message);
        await refreshCustomers();
      }
      return response.data;
    } finally {
      pendingRef.current = false;
      if (mounted.current) setPending(false);
    }
  };

  return {
    customers, loading, error, pending, refreshCustomers,
    addCustomer: (data, requestKey) => mutate(() => createCustomerAPI(data, requestKey), "Customer added successfully"),
    editCustomer: (id, data) => mutate(() => updateCustomerAPI(id, data), "Customer updated successfully"),
    removeCustomer: (id) => mutate(() => deleteCustomerAPI(id), "Customer archived successfully"),
  };
};

export const useCustomer = (customerId) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestVersion = useRef(0);

  const refreshCustomer = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getCustomerAPI(customerId);
      if (version !== requestVersion.current) return false;
      setCustomer(response.data);
      return true;
    } catch (failure) {
      if (version === requestVersion.current) {
        setError(customerError(failure, "Unable to load this customer. Please try again."));
        if ([401, 403, 404].includes(failure.response?.status)) setCustomer(null);
      }
      return false;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    setCustomer(null);
    void refreshCustomer();
    const onFocus = () => {
      if (document.visibilityState !== "hidden") void refreshCustomer();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      requestVersion.current += 1;
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshCustomer]);

  return { customer, loading, error, refreshCustomer };
};
