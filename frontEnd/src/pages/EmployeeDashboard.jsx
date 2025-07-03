import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const EmployeeDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  useEffect(() => {
    if (user && user.role == "employee") {
      fetchEmployeeTasks(user.empId);
    }
  }, []);

  const fetchEmployeeTasks = async (empId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/employee/tasks/${empId}`);
      setTasks(res.data);
      console.log("task fetched for employee", user.empId);
    } catch (err) {
      console.error("Error fetching employee tasks:", err);
    }
  };

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

      const res = await axios.put(
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
      await axios.delete(`${BASE_URL}/api/employee/tasks/${taskId}`);
      console.log("Task deleted", taskId);
      setTasks(prevTasks => prevTasks.filter((t => t.taskId !== taskId)));
    } catch (err) {
      console.error("Error in deleting the task....", err);
    }
  };

  return (
    <div>
      <Navbar />
      {/* main */}
      <div className="flex flex-wrap justify-evenly">
        <div className="w-200 h-120 border mt-12 p-4">
          <div className="h-10 text-2xl">My Tasks</div>
          <div className="h-100 w-full overflow-auto">
            {/* card */}
            {tasks.map((task) => {
              return (
                <div
                  key={task.taskId}
                  onClick={() => handleUpdateTaskStatus(task)}
                  className={`w-full ${
                    task.status === "done"
                      ? "bg-green-200 hover:bg-green-300 cursor-pointer"
                      : task.status === "in-progress"
                      ? "bg-blue-300 hover:bg-blue-400 cursor-pointer"
                      : "bg-red-300 hover:bg-red-400 cursor-pointer"
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
                      className="border-b border-l border-black p-0.5 px-4 ml-4 max-h-8 bg-gray-500 hover:bg-gray-800 text-white"
                    >
                      Delete
                    </button>
                  </div>
                  {/* lower */}
                  <div className="flex w-full pt-2">
                    <div className="w-150 text-justify pl-4">
                      {task.description}
                    </div>
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
        </div>
        <div className="w-140 h-100 border mt-12 p-4">
          <div>Notification</div>
        </div>
        <div className="w-170 h-100 border mt-12 p-4">
          <div>My Quotations</div>
        </div>
        <div className="w-170 h-100 border mt-12 p-4">
          <div>Confirmed Orders</div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
