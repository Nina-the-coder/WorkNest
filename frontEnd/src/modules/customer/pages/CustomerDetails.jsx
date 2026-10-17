import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import { useCustomer } from "../hooks/useCustomers";
import { formatCustomerDate } from "../customer.util";

const CustomerDetails = () => {
  const { customerId } = useParams();
  const { user } = useAuth();
  const { customer, loading, error, refreshCustomer } = useCustomer(customerId);
  const basePath = user?.role === "admin" ? "/admin/customers" : "/employee/customers";
  const fields = customer ? [
    ["Customer ID", customer.customerId], ["Name", customer.name],
    ["Address", customer.address], ["Contact", customer.contact],
    ["GST", customer.gst], ["Email", customer.email],
    ["Status", customer.status], ["Company Type", customer.companyType],
    ["Added By", customer.addedBy?.name],
    ["Created", formatCustomerDate(customer.createdAt)],
    ["Updated", formatCustomerDate(customer.updatedAt)],
  ].filter(([, value]) => typeof value === "string" && value.trim()) : [];

  return (
    <div className="pb-8">
      <Header title="Customer Details" />
      <div className="my-6 flex items-center justify-between">
        <Link to={basePath} className="text-text underline">Back to Customers</Link>
        <button type="button" onClick={refreshCustomer} disabled={loading}
          className="rounded-xl border border-cta px-4 py-2 text-text disabled:opacity-50">Refresh</button>
      </div>
      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red p-4 text-text">
          <p>{error.status === 404 ? "Customer not found or archived."
            : error.status === 403 ? "You do not have permission to view this customer." : error.message}</p>
          <button type="button" onClick={refreshCustomer} disabled={loading} className="mt-2 underline">Retry</button>
        </div>
      )}
      {loading && !customer ? <SkeletonLoader count={1} /> : customer && (
        <dl aria-busy={loading} className="max-w-3xl space-y-4 rounded-2xl bg-card-bg p-6">
          {fields.map(([label, value]) => (
            <div key={label} className="flex flex-wrap gap-x-4 gap-y-1">
              <dt className="min-w-32 text-secondary-text">{label}</dt>
              <dd className="break-words whitespace-pre-wrap text-text">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
};

export default CustomerDetails;
