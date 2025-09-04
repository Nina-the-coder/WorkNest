import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import CustomerTable from "../components/CustomerTable";
import EmployeeComboBox from "../components/combobox/EmployeeComboBox";
import VariantButton from "../components/buttons/VariantButton";
import CTAButton from "../components/buttons/CTAButton";
import { toast } from "react-toastify";
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave(e);
    }
  };

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
      toast.warn("Please fill at least the name of the cutomer");
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
        toast.success("Customer updated successfullly");
        setIsEdit(false);
        setEditCustomerId(null);
      } else {
        if (!formData.addedBy) {
          alert("Please select the employee name");
          return;
        }
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
        toast.success("Customer added successfully");
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
      console.error("Error in saving the customer data>>>", err);
      toast.error(message);
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
    const confirmDelete = window.confirm(
      `Are you sure you want to delete customer ${customerId}?`
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(`${BASE_URL}/api/admin/customers/${customerId}`);
      await fetchCustomers();
      console.log("Customer deleted successfully");
      toast.success("Customer deleted successfully");
    } catch (err) {
      console.error("Error deleting the customer>>>", err);
      toast.error("Error deleting the customer");
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

    const matchesCompany =
      companyTypeFilter === "" ||
      customer.companyType.toLowerCase() ===
        companyTypeFilter.toLowerCase();
    return matchesCustomer && matchesFilter && matchesCompany;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center bg-bg">
        {/* header */}
        <Header title="Customer Management" />

        {/* modal */}
        {modal && (
          <div className="max-w-[460px] h-fit rounded-2xl mt-16 p-10 bg-card-bg bg-gradient-to-r from-bg/80 to-card-bg/0 transition-all duration-300">
            <div className="text-[20px] flex items-center justify-center mb-8 ml-4 text-text">
              {isEdit ? "Edit Customer" : "Add New Customer"}
            </div>
            <form
              className="flex flex-col items-center gap-1"
              onKeyDown={(e) => handleKeyDown(e)}
            >
              {" "}
              <label
                htmlFor="name"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Customer Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />
              <label
                htmlFor="address"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />
              <label
                htmlFor="contact"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Contact
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />
              <label
                htmlFor="gst"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                GST
              </label>
              <input
                type="text"
                id="gst"
                name="gst"
                value={formData.gst}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />
              <label
                htmlFor="email"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
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
              <div className="flex w-full justify-between">
                <div className="flex flex-col">
                  <label
                    htmlFor="status"
                    className="w-full text-[16px] ml-4 text-text/90"
                  >
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    onChange={handleChange}
                    value={formData.status}
                    className="w-[160px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label
                    htmlFor="companyType"
                    className="w-full text-[16px] ml-4 text-text/90"
                  >
                    Company
                  </label>
                  <select
                    name="companyType"
                    id="companyType"
                    onChange={handleChange}
                    value={formData.companyType}
                    className="w-[160px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                  >
                    <option value="dealer">dealer</option>
                    <option value="doctor">doctor</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-around items-center gap-[50px] mt-4">
                {" "}
                <VariantButton
                  onClick={handleCancel}
                  variant="ghostRed"
                  size="medium"
                  text="Cancel"
                  icon="x"
                />
                <VariantButton
                  onClick={handleSave}
                  variant="cta"
                  size="medium"
                  text="Save"
                  icon="check"
                />
              </div>
            </form>
          </div>
        )}

        {/* Search Bar and CTA button */}
        {!modal && (
          <div className="flex mt-16 mb-20 px-10 w-full">
            <div className="flex gap-4">
              <SearchBar
                placeholder="Search for a customer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <FilterDropdown
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">active</option>
                <option value="inactive">Inactive</option>
              </FilterDropdown>

              <FilterDropdown
                value={companyTypeFilter}
                onChange={(e) => setCompanyTypeFilter(e.target.value)}
              >
                <option value="">All Company</option>
                <option value="dealer">dealer</option>
                <option value="doctor">doctor</option>
              </FilterDropdown>
            </div>

            <div className="ml-20">
              <CTAButton onClick={handleAddNewCustomer} icon="plus">
                <div className="text-left mb-1">Add new</div>
                <div className="text-left">Customer</div>
              </CTAButton>
            </div>
          </div>
        )}

        {/* container */}
        {!modal && (
          <div className="w-300 max-h-120 overflow-y-auto h-fit flex flex-wrap text-white">
            {filteredCustomers.length === 0 ? (
              <div className="ml-40">No Customer found</div>
            ) : (
              <CustomerTable
                filteredCustomers={filteredCustomers}
                handleEdit={handleEditCustomer}
                handleDelete={handleDeleteCustomer}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerkManagement;
