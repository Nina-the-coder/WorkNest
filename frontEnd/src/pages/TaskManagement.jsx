import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import EmployeeComboBox from "../components/EmployeeComboBox";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const TaskManagement = () => {
  const [formData, setFormData] = useState({
    assignedTo: "",
    title: "",
    description: "",
    dueDate: "",
    status: "pending",
    priority: "medium",
  });
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [taskRes, empRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/admin/tasks`),
        axios.get(`${BASE_URL}/api/admin/employees`),
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
      console.error("Error fetching tasks or employees", err);
    }
  };

  useEffect(() => {
    fetchData();
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
      const currentUser = JSON.parse(localStorage.getItem("user"));

      const payload = {
        ...formData,
        assignedBy: currentUser._id,
      };

      if (isEdit) {
        await axios.put(`${BASE_URL}/api/admin/tasks/${editTaskId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("task updated successfullly");
        setIsEdit(false);
        setEditTaskId(null);
      } else {
        const res = await axios.post(`${BASE_URL}/api/admin/tasks`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        console.log("Sending Task: ", res.data);
      }

      await fetchData();
      setFormData({
        assignedTo: "",
        title: "",
        description: "",
        dueDate: "",
        status: "pending",
        priority: "medium",
      });
      setModal(false);
    } catch (err) {
      const message =
        err.response?.data?.message || "An error occurred while saving task.";
      setError(message);
    }
  };

  const handleEditTask = (task) => {
    console.log("editing the task", task);
    setIsEdit(true);
    setEditTaskId(task.taskId);
    setFormData({
      assignedTo: task.assignedTo,
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
      await fetchData();
      console.log("task deleted successfully");
    } catch (err) {
      console.error("Error deleting the task>>>", err);
    }
  };

  const handleCancel = () => {
    setFormData({
      assignedTo: "",
      title: "",
      description: "",
      dueDate: "",
      status: "pending",
      priority: "medium",
    });

    console.log("cancelled");
    setModal(false);
    setIsEdit(false);
    setEditTaskId(null);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesTask =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedTo?.empId
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      task.assignedTo?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      statusFilter === "" ||
      task.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesPriority =
      priorityFilter === "" ||
      task.priority.toLowerCase() === priorityFilter.toLowerCase();

    return matchesTask && matchesFilter && matchesPriority;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center bg-slate-900">
        {/* header */}
        <div className="w-full flex justify-between text-white">
          <div className="text-3xl">Task Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* modal */}
        {modal && (
          <div className="w-100 h-fit mt-16 p-8 bg-slate-800">
            <div className="text-3xl mb-8 ml-4 text-white">
              {isEdit ? "Edit Task" : "Add New Task"}
            </div>
            <form onKeyDown={(e) => handleKeyDown(e)}>
              <EmployeeComboBox
                onSelect={(emp) =>
                  setFormData((prev) => ({
                    ...prev,
                    assignedTo: emp._id,
                  }))
                }
              />

              <label htmlFor="title" className="w-full text-lg text-slate-200">
                Task Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label
                htmlFor="description"
                className="w-full text-lg text-slate-200"
              >
                Description
              </label>
              <textarea
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="border w-full h-20 p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label
                htmlFor="dueDate"
                className="w-full text-lg text-slate-200"
              >
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="border w-full mb-10 bg-slate-200 p-0.5"
              />

              <label htmlFor="status" className="text-lg text-slate-200">
                Status
              </label>
              <select
                name="status"
                id="status"
                onChange={handleChange}
                value={formData.status}
                className="w-1/4 ml-2 mr-8 p-0.5 bg-slate-200 border"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
              </select>

              <label htmlFor="priority" className="text-lg text-slate-200">
                Priority
              </label>
              <select
                name="priority"
                id="priority"
                onChange={handleChange}
                value={formData.priority}
                className="w-1/4 ml-2 p-0.5 bg-slate-200 border"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              {error && (
                <div className="text-rose-500 mb-2 text-sm mt-4">{error}</div>
              )}
              <div className="flex justify-around items-center mt-4">
                <button
                  onClick={handleCancel}
                  className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSave}
                  className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
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
                placeholder="Search tasks by title, description, employee"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                name=""
                id=""
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 border-l bg-white hover:cursor-pointer px-2"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In-Progress</option>
                <option value="done">Done</option>
              </select>
              <select
                name=""
                id=""
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-10 border-l bg-white hover:cursor-pointer px-2"
              >
                <option value="">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="h-full w-1/4 items-center flex ml-20">
              <button
                className="w-full p-8 text-2xl rounded-xl text-white bg-indigo-800 hover:cursor-pointer hover:bg-indigo-900"
                onClick={handleAddNewTask}
              >
                Add new Task
              </button>
            </div>
          </div>
        )}

        {/* container */}
        {!modal && (
          <div className="w-300 max-h-120 overflow-auto h-fit flex flex-wrap pt-8 text-white">
            {filteredTasks.length === 0 ? (
              <div className="ml-40">No Task found</div>
            ) : (
              filteredTasks.map((task, index) => (
                <div
                  key={index}
                  className="w-[45%] h-80 bg-slate-800 mb-8 ml-8 p-2 flex justify-between flex-col"
                >
                  {/* top */}
                  <div className="overflow-auto">
                    <div className="flex mb-2">
                      <div className="text-xl font-bold text-white">
                        {task.title}
                      </div>
                      <div className="text-lg ml-8 w-[35%] font-sans text-slate-300">
                        {`${task.assignedTo?.name} (${task.assignedTo?.empId})`}
                      </div>
                    </div>
                    <div className="flex justify-evenly">
                      <div
                        className={`text-xl p-0.5 px-4 ${
                          task.status === "pending"
                            ? "bg-rose-500"
                            : task.status === "in-progress"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        } rounded-xl`}
                      >
                        {task.status}
                      </div>
                      <div
                        className={`text-xl p-0.5 px-4 ${
                          task.priority === "high"
                            ? "bg-rose-500"
                            : task.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-yellow-300"
                        } rounded-xl`}
                      >
                        {task.priority}
                      </div>
                      <div className="text-xl p-0.5 px-4 text-white">
                        due:
                        {new Date(task.dueDate)
                          .toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                          .toUpperCase()}
                      </div>
                    </div>
                    <div className="text-justify p-2 mt-2 text-lg text-slate-300">
                      {task.description}
                    </div>
                  </div>
                  {/* bottom */}
                  <div className="align-baseline flex justify-evenly my-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 w-30 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.taskId)}
                      className="p-2 w-30 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;
