import React from "react";
import Icon from "./Icons";

const CustomerTable = ({ filteredCustomers, handleEdit, handleDelete }) => {
  return (
    <table className="table-auto w-full text-sm text-left text-secondary-text">
      <thead className="bg-card-bg text-text sticky top-0">
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
      <tbody className="text-secondary-text">
        {filteredCustomers.map((customer, index) => (
          <tr key={index} className="">
            <td className="px-4 py-2 border">{customer.customerId}</td>
            <td className="px-4 py-2 border">{customer.name}</td>
            <td className="px-4 py-2 border">{customer.address}</td>
            <td className="px-4 py-2 border">{customer.contact}</td>
            <td className="px-4 py-2 border">{customer.gst}</td>
            <td className="px-4 py-2 border">{customer.email}</td>
            <td className="px-4 py-2 border">{customer.status}</td>
            <td className="px-4 py-2 border">{customer.companyType}</td>
            <td className="px-4 py-2 border">{customer.addedBy?.name}</td>
            <td className="border">
              <div className="flex justify-evenly items-center">
                <button
                  onClick={() => handleEdit(customer)}
                  className="text-cta hover:cursor-pointer"
                >
                  <Icon name="pencil" className="" />
                </button>
                <button
                  className="text-red hover:cursor-pointer"
                  onClick={() => handleDelete(customer.customerId)}
                >
                  <Icon name="trash-2" className="" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default CustomerTable;
