import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const EmployeeManagement = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "employee",
    status: "active",
  });
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [editEmpId, setEditEmpId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/employees`);
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
    if (!formData.name || !formData.email || (!isEdit && !formData.password)) {
      alert("Please fill all required fields");
      return;
    }
    if (formData.password && formData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    if (formData.phone.length !== 10) {
      alert("Phone number must have 10 digits");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (isEdit) {
        const updatedFormData = { ...formData };
        if (!formData.password) {
          delete updatedFormData.password;
        }

        await axios.put(
          `${BASE_URL}/api/admin/employees/${editEmpId}`,
          updatedFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Employee updated successfully");
        setIsEdit(false);
        setEditEmpId(null);
      } else {
        const res = await axios.post(
          `${BASE_URL}/api/admin/employees`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Employee added successfully to the DB:", res.data);
      }

      await fetchEmployees();
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "employee",
        status: "active",
      });

      setModal(false);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "An error occurred while saving employee.";
      setError(message);
    }
  };

  const handleEditEmployee = (emp) => {
    console.log("editing the employee", emp);
    setIsEdit(true);
    setEditEmpId(emp.empId);
    setFormData({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      password: "",
      role: emp.role,
      status: emp.status,
    });
    setModal(true);
  };

  const handleDeleteEmployee = async (empId) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete employee ${empId}?`
    );
    if (!confirmDelete) return;
    try {
      await axios.delete(`${BASE_URL}/api/admin/employees/${empId}`);
      await fetchEmployees();
    } catch (err) {
      console.error("Error deleting employee:...", err);
    }
  };

  const handleCancel = () => {
    console.log("cancelled");
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "employee",
      status: "active",
    });
    setModal(false);
    setIsEdit(false);
    setEditEmpId(null);
    setError("");
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.empId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "" || emp.role.toLowerCase() === roleFilter.toLowerCase();

    const matchesStatus = statusFilter === "" || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center bg-slate-900">
        {/* header */}
        <div className="w-full flex justify-between text-white">
          <div className="text-3xl">Employee Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* modal */}
        {modal && (
          <div className="w-100 h-fit mt-16 p-8 border bg-slate-800">
            <div className="text-3xl mb-8 ml-4 text-white">
              {isEdit ? "Edit Employee" : "Add New Employee"}
            </div>
            <form>
              <label htmlFor="name" className="w-full text-lg text-slate-200">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label htmlFor="email" className="w-full text-lg text-slate-200">
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label htmlFor="phone" className="w-full text-lg text-slate-200">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label
                htmlFor="password"
                className="w-full text-lg text-slate-200"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-8 bg-slate-200"
              />

              <label htmlFor="role" className="text-lg mr-1.5 text-slate-200">
                Role
              </label>
              <select
                className="border w-1/3 bg-slate-200 p-0.5"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </select>

              <label
                htmlFor="status"
                className="text-lg ml-4 mr-1.5 text-slate-200"
              >
                Status
              </label>
              <select
                className="border w-1/3 bg-slate-200 p-0.5"
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {error && (
                <div className="text-rose-500 mb-2 text-sm mt-4">{error}</div>
              )}
              <div className="flex justify-around items-center">
                <button
                  onClick={handleCancel}
                  className="mt-8 p-2 px-10 w-30 text-white text-lg hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSave}
                  className="mt-8 p-2 px-10 w-30 text-white text-lg hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar and CTA button */}
        {!modal && (
          <div className="flex my-16 px-10 h-20 w-full">
            <div className="h-full w-1/2 items-center flex">
              <input
                type="text"
                className="h-10 w-3/4 bg-white px-2"
                placeholder="Search employee by name, email, empId"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                name=""
                id=""
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 border-l bg-white hover:cursor-pointer px-2"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="Employee">Employee</option>
              </select>
              <select
                name=""
                id=""
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 border-l bg-white hover:cursor-pointer px-2"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="h-full w-1/4 items-center flex ml-20">
              <button
                className="border border-slate-800 p-8 w-full text-2xl rounded-xl text-white bg-indigo-800 hover:cursor-pointer hover:bg-indigo-900"
                onClick={handleAddNewEmployee}
              >
                Add new Employee
              </button>
            </div>
          </div>
        )}

        {/* container */}
        {!modal && (
          <div className="w-200 mr-100 max-h-120 overflow-auto flex flex-col gap-4 justify-evenly items-center p-6 text-white">
            {/* cards */}
            {filteredEmployees.length === 0
              ? "No Employee found"
              : filteredEmployees.map((emp) => (
                  <div
                    key={emp.empId}
                    className="w-[100%] h-fit bg-slate-800 flex"
                  >
                    {/* left */}
                    <div className="flex flex-col w-[75%] p-2">
                      <div className="flex gap-12 items-center mb-2">
                        <div className="text-2xl text-white">{emp.empId}</div>
                        <div
                          className={`text-xl ${
                            emp.status === "active"
                              ? "bg-amber-500"
                              : "bg-rose-500 "
                          } p-0.5 px-4 rounded-xl text-black`}
                        >
                          {emp.status}
                        </div>
                        <div className="text-xl bg-emerald-500 p-0.5 px-4 rounded-xl text-black">
                          {emp.role}
                        </div>
                      </div>
                      <div className="text-lg text-slate-300">
                        Name: {emp.name}
                      </div>
                      <div className="text-lg text-slate-300">
                        Email: {emp.email}
                      </div>
                      <div className="text-lg text-slate-300">
                        Phone: {emp.phone}
                      </div>
                    </div>
                    {/* right */}
                    <div className="flex items-center">
                      <button
                        onClick={() => handleEditEmployee(emp)}
                        className="p-2 w-25 text-lg hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(emp.empId)}
                        className="p-2 w-25 mx-4 text-lg hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;
