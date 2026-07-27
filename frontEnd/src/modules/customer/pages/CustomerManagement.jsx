// modules/customer/pages/CustomerManagement.jsx
import { useState } from "react";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import CustomerTable from "../components/CustomerTable";
import CustomerModal from "../components/CustomerModal";
import CustomerFilters from "../components/CustomerFilters";
import { useCustomers } from "../hooks/useCustomers";
import { toast } from "react-toastify";

const CustomerManagement = () => {
  const { customers, loading, addCustomer, editCustomer, removeCustomer } =
    useCustomers();

  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("");

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

  const resetForm = () => {
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
    setIsEdit(false);
    setEditCustomerId(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.warn("Customer name required");
      return;
    }

    if (isEdit) {
      await editCustomer(editCustomerId, formData);
    } else {
      if (!formData.addedBy) return toast.warn("Select employee");

      await addCustomer(formData);
    }

    setModal(false);
    resetForm();
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col">
      <Header title="Customer Management" />

      {modal ? (
        <CustomerModal
          formData={formData}
          setFormData={setFormData}
          handleChange={handleChange}
          handleSave={handleSave}
          handleCancel={() => {
            resetForm();
            setModal(false);
          }}
          isEdit={isEdit}
        />
      ) : (
        <>
          <CustomerFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            companyTypeFilter={companyTypeFilter}
            setCompanyTypeFilter={setCompanyTypeFilter}
            openModal={() => setModal(true)}
          />

          {loading ? (
            <SkeletonLoader count={6} />
          ) : (
            <CustomerTable
              filteredCustomers={filteredCustomers}
              handleEdit={(customer) => {
                setIsEdit(true);
                setEditCustomerId(customer.customerId);
                setFormData(customer);
                setModal(true);
              }}
              handleDelete={(id) => removeCustomer(id)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CustomerManagement;
