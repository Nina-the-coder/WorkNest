// modules/customer/hooks/useCustomers.js
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getCustomersAPI,
  createCustomerAPI,
  updateCustomerAPI,
  deleteCustomerAPI,
} from "../services/customer.api";

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await getCustomersAPI();
      setCustomers(res.data);
    } catch (err) {
      toast.error("Error fetching customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const addCustomer = async (data) => {
    await createCustomerAPI(data);
    toast.success("Customer added successfully");
    fetchCustomers();
  };

  const editCustomer = async (id, data) => {
    await updateCustomerAPI(id, data);
    toast.success("Customer updated successfully");
    fetchCustomers();
  };

  const removeCustomer = async (id) => {
    if (!window.confirm(`Delete customer ${id}?`)) return;

    await deleteCustomerAPI(id);
    toast.success("Customer deleted successfully");
    fetchCustomers();
  };

  return {
    customers,
    loading,
    addCustomer,
    editCustomer,
    removeCustomer,
  };
};