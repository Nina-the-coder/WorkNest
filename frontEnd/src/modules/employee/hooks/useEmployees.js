// modules/employee/hooks/useEmployees.js
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getEmployeesAPI,
  createEmployeeAPI,
  updateEmployeeAPI,
  deleteEmployeeAPI,
} from "../services/employee.api";

export const useEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await getEmployeesAPI();
      setEmployees(res.data);
    } catch (err) {
      toast.error("Error fetching employees");
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (data) => {
    await createEmployeeAPI(data);
    toast.success("Employee added successfully");
    fetchEmployees();
  };

  const editEmployee = async (id, data) => {
    const token = localStorage.getItem("token");
    await updateEmployeeAPI(id, data, token);
    toast.success("Employee updated successfully");
    fetchEmployees();
  };

  const removeEmployee = async (id) => {
    await deleteEmployeeAPI(id);
    toast.success("Employee deleted successfully");
    fetchEmployees();
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return {
    employees,
    loading,
    fetchEmployees,
    addEmployee,
    editEmployee,
    removeEmployee,
  };
};