import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

const EmployeeManagement = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    status: "active",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  const handleAddNewEmployee = () => {
    console.log("Add New Employee");
    setModal(true);
  };
  
  const handleSave = (e) => {
    e.preventDefault();
    console.log("Employee Added");
    console.log(formData);
    setModal(false);
  };

  const handleCancel = () => {
    console.log("cancelled");
    setModal(false);
  };

  const [modal, setModal] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center">
        {/* header */}
        <div className="w-full flex justify-between">
          <div className="text-3xl">Employee Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* modal */}
        {modal && (
          <div className="w-100 h-fit mt-16 p-8 border bg-gray-300">
            <div className="text-3xl mb-8 ml-4">Add New Employee</div>
            <form>
              <label htmlFor="name" className="w-full text-lg">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-white"
              />

              <label htmlFor="email" className="w-full text-lg">
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-white"
              />

              <label htmlFor="password" className="w-full text-lg">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-8 bg-white"
              />

              <label htmlFor="role" className="text-lg mr-1.5">
                Role
              </label>
              <select
                className="border w-1/3 bg-white p-0.5"
                id="role"
                name="role"
                onChange={handleChange}
              >
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>

              <label htmlFor="status" className="text-lg ml-4 mr-1.5">
                Status
              </label>
              <select
                className="border w-1/3 bg-white p-0.5"
                id="status"
                name="status"
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="mt-8 flex justify-around items-center">
                <button
                  onClick={handleCancel}
                  className="mt-8 p-2 px-10 border hover:cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSave}
                  className="mt-8 p-2 px-10 border hover:cursor-pointer bg-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar and CTA button */}
        <div className="flex justify-between my-16 px-10 h-20 w-full">
          <div className="h-full w-3/4 items-center flex">
            <input type="text" className="border h-10 w-3/4" />
          </div>
          <div className="h-full w-1/4 items-center flex">
            <button
              className="border p-8 w-full text-2xl rounded-xl"
              onClick={handleAddNewEmployee}
            >
              Add new Employee
            </button>
          </div>
        </div>

        {/* container */}
        <div className="w-11/12 bg-gray-400 h-100"></div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
