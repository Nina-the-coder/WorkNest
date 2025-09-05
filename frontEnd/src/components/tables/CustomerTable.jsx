import React from "react";
import VariantButton from "../buttons/VariantButton";

const CustomerTable = ({ filteredCustomers, handleEdit, handleDelete }) => {
  if (!filteredCustomers || filteredCustomers.length === 0) {
    return (
      <div className="w-full flex justify-center items-center p-6 text-secondary-text">
        No customers found
      </div>
    );
  }

  return (
    <div className="w-full bg-card-bg/50 rounded-2xl shadow-md shadow-secondary-text/30">
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
            <th className="px-4 py-3 text-center">Actions</th>
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
                {customer.customerId}
              </td>
              <td className="px-4 py-3">{customer.name}</td>
              <td className="px-4 py-3">{customer.address}</td>
              <td className="px-4 py-3">{customer.contact}</td>
              <td className="px-4 py-3">{customer.gst}</td>
              <td className="px-4 py-3 break-words whitespace-normal max-w-[200px]">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${customer.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {customer.email}
                </a>
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    customer.status === "active"
                      ? "bg-green text-black"
                      : "bg-orange text-black"
                  }`}
                >
                  {customer.status}
                </span>
              </td>
              <td className="px-4 py-3">{customer.companyType}</td>
              <td className="px-4 py-3">{customer.addedBy?.name}</td>
              <td className="px-4 py-3 flex gap-2 justify-center">
                <VariantButton
                  onClick={() => handleEdit(customer)}
                  variant="ghostCta"
                  size="tiny"
                  text=""
                  icon="pen"
                />
                <VariantButton
                  onClick={() => handleDelete(customer.customerId)}
                  variant="ghostRed"
                  size="tiny"
                  text=""
                  icon="trash-2"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
