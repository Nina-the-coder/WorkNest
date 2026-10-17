import { useEffect, useRef, useState } from "react";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import { useAuth } from "../../auth/useAuth";
import CustomerTable from "../components/CustomerTable";
import CustomerModal from "../components/CustomerModal";
import CustomerFilters from "../components/CustomerFilters";
import { useCustomers } from "../hooks/useCustomers";
import { customerFormData, customerPayload, createCustomerRequestKey, validateCustomerForm } from "../customer.util";

const CustomerManagement = () => {
  const { user } = useAuth();
  const { customers, loading, error, pending, refreshCustomers, addCustomer, editCustomer, removeCustomer } = useCustomers();
  const canCreate = user?.permissions?.includes("CUSTOMER_CREATE");
  const canEdit = user?.permissions?.includes("CUSTOMER_UPDATE");
  const canArchive = user?.permissions?.includes("CUSTOMER_ARCHIVE");
  const basePath = user?.role === "admin" ? "/admin/customers" : "/employee/customers";
  const [modal, setModal] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [companyTypeFilter, setCompanyTypeFilter] = useState("");
  const [formData, setFormData] = useState(customerFormData);
  const [formError, setFormError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const requestKey = useRef(null);
  const savePending = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const openForm = (customer = null) => {
    if (pending || (customer ? !canEdit : !canCreate)) return;
    setFormData(customerFormData(customer || {}));
    setEditCustomerId(customer?.customerId || null);
    setFormError(null);
    requestKey.current = createCustomerRequestKey();
    setModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setFormError(null);
    // A changed payload is a new creation intent; unchanged retries keep their key.
    requestKey.current = createCustomerRequestKey();
  };

  const handleSave = async () => {
    if (savePending.current || pending || (editCustomerId ? !canEdit : !canCreate)) return;
    const validationError = validateCustomerForm(formData);
    if (validationError) { setFormError(validationError); return; }
    savePending.current = true;
    setFormError(null);
    try {
      const payload = customerPayload(formData);
      const result = editCustomerId
        ? await editCustomer(editCustomerId, payload)
        : await addCustomer(payload, requestKey.current);
      if (mounted.current && result) setModal(false);
    } catch (failure) {
      if (mounted.current) setFormError(failure.response?.data?.message || "Unable to save customer. Please try again.");
    } finally {
      savePending.current = false;
    }
  };

  const handleArchive = async (id) => {
    if (!canArchive || pending || !window.confirm(`Archive customer ${id}?`)) return;
    setActionError(null);
    try {
      await removeCustomer(id);
    } catch (failure) {
      if (mounted.current) setActionError(failure.response?.data?.message || "Unable to archive customer. Please try again.");
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredCustomers = customers.filter((customer) =>
    [customer.name, customer.customerId, customer.email, customer.contact].some((value) =>
      typeof value === "string" && value.toLowerCase().includes(query))
    && (!statusFilter || customer.status === statusFilter)
    && (!companyTypeFilter || customer.companyType === companyTypeFilter),
  );

  return (
    <div className="flex flex-col pb-8">
      <Header title="Customer Management" />
      {modal ? (
        <CustomerModal formData={formData} handleChange={handleChange} handleSave={handleSave}
          handleCancel={() => { if (!pending) setModal(false); }} isEdit={Boolean(editCustomerId)}
          pending={pending} error={formError} />
      ) : (
        <>
          <CustomerFilters searchQuery={searchQuery} setSearchQuery={setSearchQuery}
            statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            companyTypeFilter={companyTypeFilter} setCompanyTypeFilter={setCompanyTypeFilter}
            openModal={() => openForm()} canCreate={canCreate} />
          <div className="mb-4 flex justify-end">
            <button type="button" onClick={refreshCustomers} disabled={loading || pending}
              className="rounded-xl border border-cta px-4 py-2 text-text disabled:opacity-50">Refresh</button>
          </div>
          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red p-4 text-text">
              <p>{error.status === 403 ? "You do not have permission to view customers." : error.message}</p>
              <button type="button" onClick={refreshCustomers} disabled={loading || pending} className="mt-2 underline">Retry</button>
            </div>
          )}
          {actionError && <p role="alert" className="mb-4 text-red">{actionError}</p>}
          {loading && !customers.length ? <SkeletonLoader count={6} /> : (!error || customers.length > 0) && (
            <CustomerTable filteredCustomers={filteredCustomers} basePath={basePath}
              handleEdit={openForm} handleDelete={handleArchive}
              canEdit={canEdit} canArchive={canArchive} pending={pending || loading} />
          )}
        </>
      )}
    </div>
  );
};

export default CustomerManagement;
