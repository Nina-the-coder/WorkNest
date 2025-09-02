import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import Header from "../components/Header";
import CTAButton from "../components/CTAButton";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import EmployeeCard from "../components/EmployeeCard";
import Icon from "../components/Icons";
import VariantButton from "../components/VariantButton";
import NoItemFoundModal from "../components/NoItemFoundModal";
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave(e);
    }
  };

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
      <div className="ml-64 w-full p-4 flex flex-col items-center bg-bg">
        {/* header */}
        <Header title="Employee Management" />

        {/* modal */}
        {modal && (
          <div className="w-[460px] h-[560px] rounded-2xl mt-16 p-8 bg-card-bg bg-gradient-to-r from-bg/80 to-card-bg/0 transition-all duration-300">
            <div className="text-[20px] flex items-center justify-center mb-8 ml-4 text-text">
              {isEdit ? "Edit Employee" : "Add New Employee"}
            </div>
            <form
              className="flex flex-col items-center gap-1"
              onKeyDown={(e) => handleKeyDown(e)}
            >
              <label
                htmlFor="name"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />

              <label
                htmlFor="email"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />

              <label
                htmlFor="phone"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />

              <label
                htmlFor="password"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />
              <div className="flex">
                <div className="flex flex-col mr-[60px]">
                  <label
                    htmlFor="role"
                    className="w-full text-[16px] ml-4 text-text/90"
                  >
                    Role
                  </label>
                  <select
                    className="w-[160px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>

                <div className="flex flex-col">
                  <label
                    htmlFor="status"
                    className="w-full text-[16px] ml-4 text-text/90"
                  >
                    Status
                  </label>
                  <select
                    className="w-[160px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              {error && (
                <div className="text-rose-500 mb-2 text-sm mt-4">{error}</div>
              )}
              <div className="flex justify-around items-center gap-[50px] mt-4">
                <VariantButton
                  onClick={handleCancel}
                  variant="ghostRed"
                  size="medium"
                  text="Cancel"
                  icon="x"
                />
                <VariantButton
                  onClick={handleSave}
                  variant="cta"
                  size="medium"
                  text="Save"
                  icon="check"
                />
              </div>
            </form>
          </div>
        )}

        {/* Search Bar and CTA button */}
        {!modal && (
          <div className="flex mt-16 mb-20 px-10 w-full">
            <div className="flex gap-4">
              <SearchBar
                placeholder="Search employee by name, email, empId"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <FilterDropdown
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="employee">Employee</option>
              </FilterDropdown>

              <FilterDropdown
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </FilterDropdown>
            </div>

            <div className="ml-20">
              <CTAButton onClick={handleAddNewEmployee} icon="plus">
                <div className="text-left mb-1">Add new</div>
                <div className="text-left">Employee</div>
              </CTAButton>
            </div>
          </div>
        )}

        {/* container */}
        {!modal && (
          <div className="w-full flex p-2 flex-wrap gap-4 h-[480px] overflow-auto">
            {/* cards */}
            {filteredEmployees.length === 0 ? (
              <NoItemFoundModal message="No employees found" />
            ) : (
              filteredEmployees.map((emp) => (
                <EmployeeCard
                  key={emp.empId}
                  emp={emp}
                  handleEdit={() => handleEditEmployee(emp)}
                  handleDelete={() => handleDeleteEmployee(emp)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;
