import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import EmployeeComboBox from "../components/EmployeeComboBox";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const CustomerkManagement = () => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact: "",
    gst: "",
    email: "",
    status: "active",
    companyType: "dealer",
    addedBy: "",
  });
  const [customers, setCustomers] = useState([]);
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("");
  const [error, setError] = useState("");

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/customers`);
      setCustomers(res.data);
    } catch (err) {
      console.error(
        "Error in fetching the customers form the database...",
        err
      );
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddNewCustomer = () => {
    console.log("Add new Customers");
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert("Please fill at least the name of the cutomer");
      return;
    }
    console.log("Form Data before saving:", formData);

    try {
      const token = localStorage.getItem("token");
      if (isEdit) {
        console.log(customers);
        await axios.put(
          `${BASE_URL}/api/admin/customers/${editCustomerId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Customer updated successfullly");
        setIsEdit(false);
        setEditCustomerId(null);
      } else {
        const res = await axios.post(
          `${BASE_URL}/api/admin/customers`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Sending Customers data: ", res.data);
      }

      await fetchCustomers();
      setFormData({
        name: "",
        address: "",
        contact: "",
        gst: "",
        email: "",
        status: "active",
        companyType: "dealer",
        addedBy: "",
      });
      setModal(false);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "An error occurred while saving the customer's data.";
      setError(message);
    }
  };

  const handleEditCustomer = (customer) => {
    console.log("editing the customer", customer);
    setIsEdit(true);
    setEditCustomerId(customer.customerId);
    setFormData({
      name: customer.name,
      address: customer.address,
      contact: customer.contact,
      gst: customer.gst,
      email: customer.email,
      status: customer.status,
      companyType: customer.companyType,
    });
    setModal(true);
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      await axios.delete(`${BASE_URL}/api/admin/customers/${customerId}`);
      await fetchCustomers();
      console.log("Customer deleted successfully");
    } catch (err) {
      console.error("Error deleting the customer>>>", err);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      address: "",
      contact: "",
      gst: "",
      email: "",
      status: "active",
      companyType: "dealer",
      addedBy: "",
    });

    console.log("cancelled");
    setModal(false);
    setIsEdit(false);
    setEditCustomerId(null);
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesCustomer =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.gst.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.addedBy?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      statusFilter === "" ||
      customer.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesCustomer && matchesFilter;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center bg-slate-900">
        {/* header */}
        <div className="w-full flex justify-between text-white">
          <div className="text-3xl">Customer Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* modal */}
        {modal && (
          <div className="w-100 h-fit mt-16 p-8 bg-slate-800">
            <div className="text-3xl mb-8 ml-4 text-white">
              {isEdit ? "Edit Customer" : "Add New Customer"}
            </div>
            <form>
              <label htmlFor="name" className="w-full text-lg text-slate-200">
                Customer Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
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
                value={formData.address}
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
                value={formData.contact}
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
                value={formData.gst}
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
                value={formData.email}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <EmployeeComboBox
                onSelect={(emp) => {
                  console.log("Selected employee:", emp);
                  setFormData((prev) => ({
                    ...prev,
                    addedBy: emp._id,
                  }));
                }}
              />

              <label htmlFor="status" className="text-lg text-slate-200">
                Status
              </label>
              <select
                name="status"
                id="status"
                onChange={handleChange}
                value={formData.status}
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
                value={formData.companyType}
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
                  onClick={handleCancel}
                  className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSave}
                  className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar and CTA button */}
        {!modal && (
          <div className="flex my-16 px-10 h-20 w-full">
            <div className="h-full w-1/2 items-center flex">
              <input
                type="text"
                className="h-10 w-3/4 bg-white px-2"
                placeholder="Search for a customer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                name=""
                id=""
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 border-l bg-white hover:cursor-pointer px-2"
              >
                <option value="">All Status</option>
                <option value="active">active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="h-full w-1/4 items-center flex ml-20">
              <button
                className="w-full p-8 text-2xl rounded-xl text-white bg-indigo-800 hover:cursor-pointer hover:bg-indigo-900"
                onClick={handleAddNewCustomer}
              >
                Add new Customer
              </button>
            </div>
          </div>
        )}

        {/* container */}
        {!modal && (
          <div className="w-300 max-h-120 overflow-y-auto h-fit flex flex-wrap text-white">
            {filteredCustomers.length === 0 ? (
              <div className="ml-40">No Customer found</div>
            ) : (
              <table className="table-auto w-full text-sm text-left text-white border border-gray-600">
                <thead className="bg-gray-800 text-white sticky top-0">
                  <tr>
                    <th className="px-4 py-2 border">Customer ID</th>
                    <th className="px-4 py-2 border">Name</th>
                    <th className="px-4 py-2 border">Address</th>
                    <th className="px-4 py-2 border">Contact</th>
                    <th className="px-4 py-2 border">GST</th>
                    <th className="px-4 py-2 border">Email</th>
                    <th className="px-4 py-2 border">Status</th>
                    <th className="px-4 py-2 border">Company Type</th>
                    <th className="px-4 py-2 border">Added By</th>
                    <th className="px-4 py-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {filteredCustomers.map((customer, index) => (
                    <tr key={index} className="hover:bg-gray-700">
                      <td className="px-4 py-2 border">
                        {customer.customerId}
                      </td>
                      <td className="px-4 py-2 border">{customer.name}</td>
                      <td className="px-4 py-2 border">{customer.address}</td>
                      <td className="px-4 py-2 border">{customer.contact}</td>
                      <td className="px-4 py-2 border">{customer.gst}</td>
                      <td className="px-4 py-2 border">{customer.email}</td>
                      <td className="px-4 py-2 border">{customer.status}</td>
                      <td className="px-4 py-2 border">
                        {customer.companyType}
                      </td>
                      <td className="px-4 py-2 border">{customer.addedBy?.name}</td>
                      <td className="px-4 py-2 border">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-blue-400 mr-2 hover:cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteCustomer(customer.customerId)
                          }
                          className="text-red-400 hover:cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerkManagement;
