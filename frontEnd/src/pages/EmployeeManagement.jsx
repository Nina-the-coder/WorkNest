import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";

const EmployeeManagement = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    status: "active",
  });

  const [employees, setEmployees] = useState([]);
  
  const fetchEmployees = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/admin/employees"
      );
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees from the db : ...", err);
    }
  };

  useEffect(() => {

    fetchEmployees();
  }, []);

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

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/admin/employees",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      await fetchEmployees();
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
        status: "active",
      });

      console.log("Employee added successfully to the DB:", res.data);
      setModal(false);
    } catch (err) {
      console.error(
        "Error adding employees to the DB:",
        err.response?.data || err.message
      );
    }
  };

  const handleEditEmployee = (e) => {
    console.log("editing the employee", e);
  };

  const handleDeleteEmployee = (e) => {
    console.log("deleting the employee", e);
  };

  const handleCancel = () => {
    console.log("cancelled");
    setFormData({
        name: "",
        email: "",
        password: "",
        role: "employee",
        status: "active",
      });
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
                value={formData.role}
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
                value={formData.status}
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
        <div className="w-200 mr-100 h-120 overflow-auto flex flex-col gap-4 justify-evenly items-center p-6 border bg-gray-500">
          {/* cards */}
          {employees.map((emp) => (
            <div
              key={emp.empId}
              className="w-[100%] h-fit border bg-white flex"
            >
              {/* left */}
              <div className="flex flex-col w-[75%] p-2">
                <div className="flex gap-12 items-center mb-2">
                  <div className="text-2xl">{emp.empId}</div>
                  <div
                    className={`text-xl ${
                      emp.status === "active" ? "bg-yellow-300" : "bg-red-300"
                    } p-0.5 px-4 rounded-xl`}
                  >
                    {emp.status}
                  </div>
                  <div className="text-xl bg-green-300 p-0.5 px-4 rounded-xl">
                    {emp.role}
                  </div>
                </div>
                <div className="text-lg">Name: {emp.name}</div>
                <div className="text-lg">Email: {emp.email}</div>
              </div>
              {/* right */}
              <div className="flex items-center">
                <button
                  onClick={handleEditEmployee}
                  className="border p-2 w-25 text-lg hover:cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={handleDeleteEmployee}
                  className="border p-2 w-25 mx-4 text-lg hover:cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
