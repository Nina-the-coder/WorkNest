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
      const res = await axios.post(`${BASE_URL}/api/admin/tasks`, formData);
      setFormData({
        assignedTo: "",
        assignedToName: "", // NEW FIELD
        title: "",
        description: "",
        dueDate: "",
        status: "pending",
        priority: "medium",
      });
      console.log("Sending Task: ", formData);
      console.log(res.data);
      setModal(false);
      await fetchTasks();
    } catch (err) {
      console.error(
        "Error adding Task to the DB: ",
        err.response?.data || err.message
      );
    }
  };

  const handleEditTask = (e) => {
    console.log("editing the task", e);
  };

  const handleDeleteTask = (e) => {
    console.log("deleting the task", e);
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

  const [modal, setModal] = useState(false);

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
        <div className="w-300 border bg-gray-400 h-fit flex flex-wrap pt-8">
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
                <button onClick={handleEditTask} className="border p-2 w-30">
                  Edit
                </button>
                <button onClick={handleDeleteTask} className="border p-2 w-30">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {/* cards */}
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;
