import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const EmployeeTaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || user.role !== "employee") {
      navigate("/login");
    } else {
      fetchEmployeeTasks(user._id);
    }
  }, []);
    
  const fetchEmployeeTasks = async (empId) => {
    try {
      const res = await api.get(`${BASE_URL}/api/employee/tasks/${empId}`);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching employee tasks:", err);
    }
  };

  // tasks
  const handleUpdateTaskStatus = async (task) => {
    try {
      let newStatus = "";
      if (task.status === "done") {
        newStatus = "pending";
      } else if (task.status === "in-progress") {
        newStatus = "done";
      } else {
        newStatus = "in-progress";
      }

      const res = await api.put(
        `${BASE_URL}/api/employee/tasks/${task.taskId}`,
        { status: newStatus }
      );

      const updated = res.data.task;

      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.taskId === task.taskId ? updated : t))
      );

      console.log(
        "status updated for the task",
        updated.taskId,
        " to ",
        updated.status
      );
    } catch (err) {
      console.error("error updating the status of the task", task);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Task ${taskId}?`
    );
    if (!confirmDelete) return;
    try {
      await api.delete(`${BASE_URL}/api/employee/tasks/${taskId}`);
      console.log("Task deleted", taskId);
      setTasks((prevTasks) => prevTasks.filter((t) => t.taskId !== taskId));
    } catch (err) {
      console.error("Error in deleting the task....", err);
    }
  };

  return (
    <div className="h-100 w-full overflow-auto text-black">
      {/* card */}
      {tasks.map((task) => {
        return (
          <div
            key={task.taskId}
            onClick={() => handleUpdateTaskStatus(task)}
            className={`w-full ${
              task.status === "done"
                ? "bg-emerald-500 hover:bg-emerald-400 cursor-pointer"
                : task.status === "in-progress"
                ? "bg-amber-500 hover:bg-amber-400 cursor-pointer"
                : "bg-rose-500 hover:bg-rose-400 cursor-pointer"
            } min-h-40 border mb-4`}
          >
            {/* upper */}
            <div className="flex justify-between min-h-8">
              <div className="flex items-center">
                <div className="text-xl ml-2">{task.title}</div>
                <div className="text-lg ml-8">-- {task.priority}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTask(task.taskId);
                }}
                className="border-b border-l border-black p-0.5 px-4 ml-4 max-h-8 bg-indigo-800 hover:bg-indigo-900 text-white"
              >
                Delete
              </button>
            </div>
            {/* lower */}
            <div className="flex w-full pt-2">
              <div className="w-150 text-justify pl-4">{task.description}</div>
              <div className="flex h-28 flex-col w-40 pl-8 justify-between">
                <div>
                  <div className="w-full">-- due date --</div>
                  <div className="w-full text-lg">
                    {new Date(task.dueDate)
                      .toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                      .toUpperCase()}
                  </div>
                </div>
                <div className="w-full text-lg">{task.status}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeTaskManagement;
