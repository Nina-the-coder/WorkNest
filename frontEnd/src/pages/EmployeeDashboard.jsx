import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

import EmployeeTaskManagement from "./employee/EmployeeTaskManagement";
import EmployeeQuotationManagement from "./employee/employeeQuotationManagement";
import EmployeeOrderManagement from "./employee/EmployeeOrderManagement";

const EmployeeDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [error, setError] = useState("");

  const [customers, setCustomers] = useState([]);

  const [customerModal, setCustomerModal] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    name: "",
    address: "",
    contact: "",
    gst: "",
    email: "",
    status: "active",
    companyType: "dealer",
    addedBy: user._id,
  });

  useEffect(() => {
    if (!user || user.role !== "employee") {
      navigate("/login");
    } else {
      fetchCustomers(user._id);
    }
  }, []);

  const handleChange = (e) => {
    setCustomerFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

// customers
  const fetchCustomers = async (emp) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/employee/customers/${emp}`
      );
      setCustomers(res.data);
    } catch (err) {
      console.error("Error in fetching the customers...");
    }
  };

  const handleCancelCustomer = () => {
    setCustomerFormData({
      name: "",
      address: "",
      contact: "",
      gst: "",
      email: "",
      status: "active",
      companyType: "dealer",
    });

    console.log("cancelled");
    setCustomerModal(false);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    console.log("FormData being submitted:", customerFormData);

    try {
      const res = await axios.post(
        `${BASE_URL}/api/admin/customers`,
        customerFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Sending the customers data", res.data);
      setCustomerFormData({
        name: "",
        address: "",
        contact: "",
        gst: "",
        email: "",
        status: "active",
        companyType: "dealer",
      });
      fetchCustomers(user._id);
      setCustomerModal(false);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "An error occured whille saving the customer's data";
      setError(message);
    }
  };

  const handleAddNewCustomer = async () => {
    setCustomerModal(true);
  };

  return (
    <div>
      <Navbar />
      {/* main */}
      <div className="flex flex-wrap justify-evenly bg-slate-900 min-h-screen">
        {/* tasks */}
        {!customerModal && (
          <div className="w-200 h-120 mt-12 p-4 bg-slate-800 text-white">
            <div className="h-10 text-2xl">My Tasks</div>
            <EmployeeTaskManagement />
          </div>
        )}

        {/* notifications */}
        {!customerModal && (
          <div className="w-140 h-100 mt-12 p-4 bg-slate-800 text-white">
            <div>Notification</div>
          </div>
        )}

        {/* quotations */}
        {!customerModal && (
          <EmployeeQuotationManagement />
        )}

        {/* orders */}
        {!customerModal && (
          <EmployeeOrderManagement />
        )}

        {/* customers model */}
        {customerModal && (
          <div className="w-100 h-fit mt-16 p-8 bg-slate-800">
            <div className="text-3xl mb-8 ml-4 text-white">
              Add new Customer
            </div>
            <form>
              <label htmlFor="name" className="w-full text-lg text-slate-200">
                Customer Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={customerFormData.name}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label
                htmlFor="address"
                className="w-full text-lg text-slate-200"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={customerFormData.address}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label
                htmlFor="contact"
                className="w-full text-lg text-slate-200"
              >
                Contact
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={customerFormData.contact}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label htmlFor="gst" className="w-full text-lg text-slate-200">
                GST
              </label>
              <input
                type="text"
                id="gst"
                name="gst"
                value={customerFormData.gst}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label htmlFor="email" className="w-full text-lg text-slate-200">
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={customerFormData.email}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label htmlFor="status" className="text-lg text-slate-200">
                Status
              </label>
              <select
                name="status"
                id="status"
                onChange={handleChange}
                value={customerFormData.status}
                className="w-1/4 ml-2 mr-2 mt-4 p-0.5 bg-slate-200 border"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <label htmlFor="companyType" className="text-lg text-slate-200">
                Company
              </label>
              <select
                name="companyType"
                id="companyType"
                onChange={handleChange}
                value={customerFormData.companyType}
                className="w-1/4 ml-2 mr-2 p-0.5 bg-slate-200 border"
              >
                <option value="dealer">dealer</option>
                <option value="doctor">doctor</option>
              </select>

              {error && (
                <div className="text-rose-500 mb-2 text-sm mt-4">{error}</div>
              )}

              <div className="flex justify-around items-center mt-4">
                <button
                  onClick={handleCancelCustomer}
                  className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSaveCustomer}
                  className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* customers */}
        {!customerModal && (
          <div className="w-120 h-100 my-12 p-4 bg-slate-800 text-white flex flex-col justify-between">
            <div>
              <div className="text-xl font-semibold mb-4">Customers</div>
              {/* cards */}
              <div className="h-70 overflow-y-auto">
                {customers.map((customer) => (
                  <div
                    key={customer.customerId}
                    className="bg-slate-300 mb-2 text-black p-2"
                  >
                    <div className="font-bold">
                      {customer.customerId} - {customer.name}
                    </div>
                    <div>{customer.email}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center items-center">
              <button
                className="py-1 px-4 bg-indigo-800 hover:bg-indigo-900 hover:cursor-pointer"
                onClick={handleAddNewCustomer}
              >
                Add New Customer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
