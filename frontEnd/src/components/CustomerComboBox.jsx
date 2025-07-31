import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const CustomerComboBox = ({ user, onSelect, selectedCustomer }) => {
  const token = localStorage.getItem("token");

  const [customers, setCustomers] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Sync input value with selectedCustomer when it changes
  useEffect(() => {
    if (
      selectedCustomer &&
      selectedCustomer.name &&
      selectedCustomer.customerId
    ) {
      setInputValue(
        `${selectedCustomer.name} (${selectedCustomer.customerId})`
      );
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (!user) return; // Don't fetch if user is not available

    const fetchCustomers = async () => {
      try {
        const url =
          user.role === "admin"
            ? `${BASE_URL}/api/admin/customers`
            : `${BASE_URL}/api/employee/customers/${user.empId}`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCustomers(res.data);
        console.log(
          "Customers being fetched to choose from for quotation",
          res.data
        );
      } catch (err) {
        console.error("Error fetching customers:", err);
      }
    };

    fetchCustomers();
  }, [user]);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const filtered = customers.filter((customer) => {
      const nameMatch = customer.name
        .toLowerCase()
        .includes(value.toLowerCase());
      const idMatch = customer.customerId
        ?.toLowerCase()
        .includes(value.toLowerCase());
      return nameMatch || idMatch;
    });

    setFilteredCustomers(filtered);
    setShowDropdown(true);
  };

  const handleSelect = (customer) => {
    const formattedValue = `${customer.name} (${customer.customerId})`;
    setInputValue(formattedValue);
    setShowDropdown(false);
    if (onSelect) onSelect(customer);
  };

  return (
    <div className="relative w-full mb-4">
      <label htmlFor="customer" className="w-full text-lg text-slate-200">
        Customer
      </label>
      <input
        type="text"
        id="customer"
        name="customer"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => {
          if (!inputValue) {
            setFilteredCustomers(customers); // Show all customers if nothing typed
          }
          setShowDropdown(true);
        }}
        className="border w-full p-0.5 rounded bg-slate-200 pl-2"
        placeholder="Type name or customerId"
      />
      {showDropdown && filteredCustomers.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto shadow">
          {filteredCustomers.map((customer, index) => (
            <li
              key={customer.customerId || index}
              onClick={() => handleSelect(customer)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {customer.name} ({customer.customerId})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerComboBox;
