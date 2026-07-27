import React from "react";
import VariantButton from "../buttons/VariantButton";

const EmployeeTable = ({ employees, handleEdit, handleDelete }) => {
  if (!employees || employees.length === 0) {
    return (
      <div className="w-full flex justify-center items-center p-6 text-secondary-text">
        No employees found
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-card-bg/50 rounded-2xl shadow-md shadow-secondary-text/30">
      <table className="w-full text-sm text-left text-secondary-text border-collapse">
        <thead className="text-xs uppercase bg-card-bg text-text">
          <tr>
            <th className="px-6 py-3">Emp ID</th>
            <th className="px-6 py-3">Name</th>
            <th className="px-6 py-3">Email</th>
            <th className="px-6 py-3">Role</th>
            <th className="px-6 py-3">Phone</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr
              key={emp.empId}
              className="border-b border-gray-700 hover:bg-bg/50 transition"
            >
              <td className="px-6 py-4 font-medium text-text">{emp.empId}</td>
              <td className="px-6 py-4">{emp.name}</td>
              <td className="px-6 py-4">
                <a
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${emp.email}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {emp.email}
                </a>
              </td>
              <td className="px-6 py-4">{emp.role}</td>
              <td className="px-6 py-4">{emp.phone}</td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    emp.status === "active"
                      ? "bg-green text-black"
                      : "bg-orange text-black"
                  }`}
                >
                  {emp.status}
                </span>
              </td>
              <td className="px-6 py-4 flex gap-2 justify-center">
                <VariantButton
                  onClick={() => handleEdit(emp)}
                  variant="ghostCta"
                  size="tiny"
                  text=""
                  icon="pen"
                />
                <VariantButton
                  onClick={() => handleDelete(emp.empId)}
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

export default EmployeeTable;
