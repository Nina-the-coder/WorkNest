// modules/task/hooks/useTasks.js
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getTasksAPI,
  getEmployeesAPI,
  createTaskAPI,
  updateTaskAPI,
  deleteTaskAPI,
} from "../services/task.api";

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [taskRes, empRes] = await Promise.all([
        getTasksAPI(),
        getEmployeesAPI(),
      ]);

      const employeeMap = {};
      empRes.data.forEach((emp) => {
        employeeMap[emp._id] = emp.name;
      });

      const updatedTasks = taskRes.data.map((task) => ({
        ...task,
        assignedToName: employeeMap[task.assignedTo] || "Unknown",
      }));

      setEmployees(empRes.data);
      setTasks(updatedTasks);
    } catch (err) {
      toast.error("Error fetching tasks");
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (data) => {
    await createTaskAPI(data);
    toast.success("Task created successfully");
    fetchData();
  };

  const editTask = async (id, data) => {
    await updateTaskAPI(id, data);
    toast.success("Task updated successfully");
    fetchData();
  };

  const removeTask = async (id) => {
    await deleteTaskAPI(id);
    toast.success("Task deleted successfully");
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    tasks,
    employees,
    loading,
    addTask,
    editTask,
    removeTask,
  };
};