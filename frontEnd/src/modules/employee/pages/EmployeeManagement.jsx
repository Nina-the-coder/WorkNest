// modules/employee/pages/EmployeeManagement.jsx
import { useState } from "react";
import Header from "../../../shared/components/Header";
import CTAButton from "../../../shared/components/buttons/CTAButton";
import EmployeeModal from "../components/EmployeeModal";
import EmployeeFilters from "../components/EmployeeFilters";
import EmployeeCard from "../components/EmployeeCard";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import { useEmployees } from "../hooks/useEmployees";

const EmployeeManagement = () => {
  const { employees, loading, addEmployee, editEmployee, removeEmployee } =
    useEmployees();

  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editEmpId, setEditEmpId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "employee",
    status: "active",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "employee",
      status: "active",
    });
    setIsEdit(false);
    setEditEmpId(null);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (isEdit) {
      await editEmployee(editEmpId, formData);
    } else {
      await addEmployee(formData);
    }

    resetForm();
    setModal(false);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "" || emp.role.toLowerCase() === roleFilter.toLowerCase();

    const matchesStatus = statusFilter === "" || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="">
      <Header title="Employee Management" />

      {modal ? (
        <EmployeeModal
          formData={formData}
          handleChange={handleChange}
          handleSave={handleSave}
          handleCancel={() => {
            resetForm();
            setModal(false);
          }}
          isEdit={isEdit}
        />
      ) : (
        <>
          <div className="flex gap-8 my-10">
            <EmployeeFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />

            <CTAButton icon={"plus"} onClick={() => setModal(true)}>
              Add Employee
            </CTAButton>
          </div>

          {loading ? (
            <SkeletonLoader count={6} />
          ) : (
            <div className="flex flex-wrap gap-4">
              {filteredEmployees.map((emp) => (
                <EmployeeCard
                  key={emp.empId}
                  emp={emp}
                  handleEdit={() => {
                    setIsEdit(true);
                    setEditEmpId(emp.empId);
                    setFormData(emp);
                    setModal(true);
                  }}
                  handleDelete={() => removeEmployee(emp.empId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmployeeManagement;
