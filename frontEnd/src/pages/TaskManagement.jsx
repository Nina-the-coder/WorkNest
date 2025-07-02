import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import EmployeeComboBox from "../components/EmployeeComboBox";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const TaskManagement = () => {
  const [formData, setFormData] = useState({
    assignedTo: "",
    assignedToName: "", // NEW FIELD
    title: "",
    description: "",
    dueDate: "",
    status: "pending",
    priority: "medium",
  });
  const [tasks, setTasks] = useState([]);
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks from the db :...", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddNewTask = () => {
    console.log("Add new task");
    setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.assignedTo || !formData.title || !formData.dueDate) {
      alert(
        "Please fill in all required fields, including selecting an employee."
      );
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (isEdit) {
        await axios.put(`${BASE_URL}/api/admin/tasks/${editTaskId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("task updated successfullly");
      } else {
        const res = await axios.post(`${BASE_URL}/api/admin/tasks`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("Sending Task: ", res.data);
      }

      await fetchTasks();
      setFormData({
        assignedTo: "",
        assignedToName: "", // NEW FIELD
        title: "",
        description: "",
        dueDate: "",
        status: "pending",
        priority: "medium",
      });
      setModal(false);
    } catch (err) {
      console.error(
        "Error adding Task to the DB: ",
        err.response?.data || err.message
      );
    }
  };

  const handleEditTask = (task) => {
    console.log("editing the task", task);
    setIsEdit(true);
    setEditTaskId(task.taskId);
    setFormData({
      assignedTo: task.assignedTo,
      assignedToName: task.assignedToName,
      title: task.title,
      description: task.description,
      dueDate: new Date(task.dueDate).toISOString().split("T")[0], // formats to YYYY-MM-DD
      status: task.status,
      priority: task.priority,
    });
    setModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${BASE_URL}/api/admin/tasks/${taskId}`);
      await fetchTasks();
      console.log("task deleted successfully");
    } catch (err) {
      console.error("Error deleting the task>>>", err);
    }
  };

  const handleCancel = () => {
    setFormData({
      assignedTo: "",
      assignedToName: "", // NEW FIELD
      title: "",
      description: "",
      dueDate: "",
      status: "pending",
      priority: "medium",
    });

    console.log("cancelled");
    setModal(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center">
        {/* header */}
        <div className="w-full flex justify-between">
          <div className="text-3xl">Task Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* modal */}
        {modal && (
          <div className="w-100 h-fit mt-16 p-8 bg-gray-300">
            <form>
              <EmployeeComboBox
                onSelect={(emp) =>
                  setFormData((prev) => ({
                    ...prev,
                    assignedTo: emp.empId,
                    assignedToName: emp.name,
                  }))
                }
              />

              <label htmlFor="title" className="w-full text-lg">
                Task Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-white"
              />

              <label htmlFor="description" className="w-full text-lg">
                Description
              </label>
              <textarea
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="border w-full h-20 p-0.5 rounded-xs mb-4 bg-white"
              />

              <label htmlFor="dueDate" className="w-full text-lg">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="border w-full mb-10 bg-white p-0.5"
              />

              <label htmlFor="status" className="text-lg">
                Status
              </label>
              <select
                name="status"
                id="status"
                onChange={handleChange}
                value={formData.status}
                className="w-1/4 ml-2 mr-8 p-0.5 bg-white border"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>

              <label htmlFor="priority" className="text-lg">
                Priority
              </label>
              <select
                name="priority"
                id="priority"
                onChange={handleChange}
                value={formData.priority}
                className="w-1/4 ml-2 p-0.5 bg-white border"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <div className="flex justify-around items-center mt-4">
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
              className="border w-full p-8 text-2xl rounded-xl"
              onClick={handleAddNewTask}
            >
              Add new Task
            </button>
          </div>
        </div>

        {/* container */}
        <div className="w-300 border max-h-120 overflow-auto bg-gray-400 h-fit flex flex-wrap pt-8">
          {tasks.map((task, index) => (
            <div
              key={index}
              className="w-[45%] h-80 bg-white mb-8 ml-8 p-2 flex justify-between flex-col"
            >
              {/* top */}
              <div className="overflow-auto">
                <div className="flex mb-2">
                  <div className="text-xl font-bold">{task.title}</div>
                  <div className="text-lg ml-8 w-[35%] font-sans">
                    {`${task.assignedToName} (${task.assignedTo})`}
                  </div>
                </div>
                <div className="flex justify-evenly">
                  <div
                    className={`text-xl p-0.5 px-4 ${
                      task.status === "pending"
                        ? "bg-yellow-300"
                        : task.status === "in-progress"
                        ? "bg-blue-300"
                        : "bg-green-300"
                    } rounded-xl`}
                  >
                    {task.status}
                  </div>
                  <div
                    className={`text-xl p-0.5 px-4 ${
                      task.priority === "high"
                        ? "bg-red-300"
                        : task.priority === "medium"
                        ? "bg-orange-300"
                        : "bg-yellow-300"
                    } rounded-xl`}
                  >
                    {task.priority}
                  </div>
                  <div className="text-xl p-0.5 px-4">
                    {new Date(task.dueDate)
                      .toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                      .toUpperCase()}
                  </div>
                </div>
                <div className="text-justify p-2 mt-2 text-lg">
                  {task.description}
                </div>
              </div>
              {/* bottom */}
              <div className="align-baseline flex justify-evenly my-2">
                <button
                  onClick={() => handleEditTask(task)}
                  className="border p-2 w-30"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTask(task.taskId)}
                  className="border p-2 w-30"
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

export default TaskManagement;
