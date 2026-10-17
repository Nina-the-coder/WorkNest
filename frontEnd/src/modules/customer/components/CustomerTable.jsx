import { Link } from "react-router-dom";
import Icon from "../../../shared/components/Icons";

const CustomerTable = ({ filteredCustomers, handleEdit, handleDelete, basePath, canEdit, canArchive, pending }) => {
  if (!filteredCustomers || filteredCustomers.length === 0) {
    return (
      <div className="w-full flex justify-center items-center p-6 text-secondary-text">
        No customers found
      </div>
    );
  }

  return (
    <div aria-busy={pending} className="w-full overflow-x-auto bg-card-bg/50 rounded-2xl shadow-md shadow-secondary-text/30">
      <table className="w-full table-auto text-sm text-left text-secondary-text border-collapse">
        {/* Header */}
        <thead className="text-xs uppercase bg-card-bg text-text">
          <tr>
            <th className="px-4 py-3">Customer ID</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">GST</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Company Type</th>
            <th className="px-4 py-3">Added By</th>
            {(canEdit || canArchive) && <th className="px-4 py-3 text-center">Actions</th>}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {filteredCustomers.map((customer) => (
            <tr
              key={customer.customerId}
              className="border-b border-gray-700 hover:bg-bg/50 transition"
            >
              <td className="px-4 py-3 font-medium text-text">
                <Link to={`${basePath}/${encodeURIComponent(customer.customerId)}`} className="hover:underline">{customer.customerId}</Link>
              </td>
              <td className="px-4 py-3"><Link to={`${basePath}/${encodeURIComponent(customer.customerId)}`} className="hover:underline">{customer.name || "Unnamed customer"}</Link></td>
              <td className="px-4 py-3">{customer.address || "—"}</td>
              <td className="px-4 py-3">{customer.contact || "—"}</td>
              <td className="px-4 py-3">{customer.gst || "—"}</td>
              <td className="px-4 py-3 break-words whitespace-normal max-w-[200px]">
                {customer.email ? <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${customer.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {customer.email}
                </a> : "—"}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    customer.status === "active"
                      ? "bg-green text-black"
                      : "bg-orange text-black"
                  }`}
                >
                  {customer.status || "Not specified"}
                </span>
              </td>
              <td className="px-4 py-3">{customer.companyType || "—"}</td>
              <td className="px-4 py-3">{customer.addedBy?.name || "—"}</td>
              {(canEdit || canArchive) && <td className="px-4 py-3 flex gap-2 justify-center">
                {canEdit && <button type="button" onClick={() => handleEdit(customer)} disabled={pending}
                  aria-label={`Edit ${customer.name || customer.customerId}`}
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-xl border-2 border-cta/60 text-text/90 hover:bg-cta disabled:opacity-50">
                  <Icon name="pen" className="h-[14px] w-[14px]" />
                </button>}
                {canArchive && <button type="button" onClick={() => handleDelete(customer.customerId)} disabled={pending}
                  aria-label={`Archive ${customer.name || customer.customerId}`}
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-xl border-2 border-red/60 text-text/90 hover:bg-red disabled:opacity-50">
                  <Icon name="trash-2" className="h-[14px] w-[14px]" />
                </button>}
              </td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
