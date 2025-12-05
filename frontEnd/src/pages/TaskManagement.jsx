import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import EmployeeComboBox from "../components/combobox/EmployeeComboBox";
import axios from "axios";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import CTAButton from "../components/buttons/CTAButton";
import TaskCard from "../components/cards/TaskCard";
import TaskTable from "../components/tables/TaskTable"; // 🆕 add this like EmployeeTable
import VariantButton from "../components/buttons/VariantButton";
import NoItemFoundModal from "../components/NoItemFoundModal";
import { toast } from "react-toastify";
import SkeletonLoader from "../components/SkeletonLoader";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const TaskManagement = () => {
  const [formData, setFormData] = useState({
    assignedTo: "",
    title: "",
    description: "quick task description",
    dueDate: "",
    status: "pending",
    priority: "medium",
  });
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [tableView, setTableView] = useState(false); // 🆕 toggle state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave(e);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAddNewTask = () => {
    setModal(true);
  };

  const handleSave = async (e) => {
    setLoading(true);
    e.preventDefault();
    if (!formData.assignedTo || !formData.title || !formData.dueDate) {
      toast.warn(
        "Please fill in all required fields, including selecting an employee."
      );
      return;
    }
    if (!formData.description) {
      toast.warn("Please provide a description for the task.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const currentUser = JSON.parse(localStorage.getItem("user"));
      const payload = { ...formData, assignedBy: currentUser._id };

      if (isEdit) {
        await axios.put(`${BASE_URL}/api/admin/tasks/${editTaskId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Task updated successfully");
        setIsEdit(false);
        setEditTaskId(null);
      } else {
        await axios.post(`${BASE_URL}/api/admin/tasks`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        toast.success("Task created successfully");
      }

      await fetchData();
      setFormData({
        assignedTo: "",
        title: "",
        description: "quick task description",
        dueDate: "",
        status: "pending",
        priority: "medium",
      });
      setModal(false);
    } catch (err) {
      const message =
        err.response?.data?.message || "An error occurred while saving task.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    setIsEdit(true);
    setEditTaskId(task.taskId);
    setFormData({
      assignedTo: task.assignedTo,
      title: task.title,
      description: task.description,
      dueDate: new Date(task.dueDate).toISOString().split("T")[0],
      status: task.status,
      priority: task.priority,
    });
    setModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setLoading(true);
      await axios.delete(`${BASE_URL}/api/admin/tasks/${taskId}`);
      await fetchData();
      toast.success("Task deleted successfully");
    } catch (err) {
      toast.error("Error deleting the task");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      assignedTo: "",
      title: "",
      description: "quick task description",
      dueDate: "",
      status: "pending",
      priority: "medium",
    });
    setModal(false);
    setIsEdit(false);
    setEditTaskId(null);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesTask =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedToName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      statusFilter === "" ||
      task.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesPriority =
      priorityFilter === "" ||
      task.priority.toLowerCase() === priorityFilter.toLowerCase();

    return matchesTask && matchesFilter && matchesPriority;
  });

  return (
      <div className="p-4 flex flex-col items-center bg-bg">
        <Header title="Task Management" />

        {/* modal */}
        {modal && (
          <div className="rounded-2xl mt-16 p-8 bg-card-bg bg-gradient-to-r from-bg/80 to-card-bg/0 transition-all duration-300">
            <div className="text-[20px] flex items-center justify-center mb-8 ml-4 text-text">
              {isEdit ? "Edit Task" : "Add New Task"}
            </div>
            <form
              className="flex flex-col items-center gap-1"
              onKeyDown={handleKeyDown}
            >
              <EmployeeComboBox
                onSelect={(emp) =>
                  setFormData((prev) => ({
                    ...prev,
                    assignedTo: emp._id,
                  }))
                }
              />
              {/* fields */}
              <label
                htmlFor="title"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Task Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />

              <label
                htmlFor="description"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-[380px] h-[84px] p-0.5 rounded-xl mb-4 bg-white"
                placeholder="write description here..."
              />

              <label
                htmlFor="dueDate"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />

              <div className="flex w-full justify-between">
                <div className="flex flex-col">
                  <label
                    htmlFor="status"
                    className="w-full text-[16px] ml-4 text-text/90"
                  >
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    onChange={handleChange}
                    value={formData.status}
                    className="w-[160px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="flex flex-col">
                  <label
                    htmlFor="priority"
                    className="w-full text-[16px] ml-4 text-text/90"
                  >
                    Priority
                  </label>
                  <select
                    name="priority"
                    id="priority"
                    onChange={handleChange}
                    value={formData.priority}
                    className="w-[160px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

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

        {/* Search Bar, Filters, CTA, Toggle */}
        {!modal && (
          <div className="flex flex-col gap-4 xl:flex-row py-4 my-10 px-10 w-full sticky top-0 bg-bg z-50 justify-between">
            <div className="flex gap-4">
              <SearchBar
                placeholder="Search tasks by title, description, employee"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <FilterDropdown
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In-Progress</option>
                <option value="done">Done</option>
              </FilterDropdown>

              <FilterDropdown
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </FilterDropdown>
            </div>

            <div className="flex gap-12 items-center lg:mr-10 justify-end">
              {/* Add new Task */}
              <CTAButton
                onClick={handleAddNewTask}
                icon="plus"
                className="ml-8"
              >
                <div className="text-left mb-1">Add new</div>
                <div className="text-left">Task</div>
              </CTAButton>
              {/* Toggle Button */}
              {!isMobile && (
                <VariantButton
                  onClick={() => setTableView(!tableView)}
                  variant="ghostCta"
                  size="medium"
                  text={tableView ? "Card" : "Table"}
                  icon={tableView ? "layout-grid" : "table"}
                />
              )}
            </div>
          </div>
        )}

        {/* container */}
        {!modal &&
          (loading ? (
            <div className="w-full p-4 gap-4">
              <SkeletonLoader count={6} className="flex flex-wrap gap-4" />
            </div>
          ) : tableView ? (
            <div className="w-full h-[500px] px-8 overflow-auto ">
              <TaskTable
                tasks={filteredTasks}
                handleEdit={handleEditTask}
                handleDelete={handleDeleteTask}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {filteredTasks.length === 0 ? (
                <NoItemFoundModal message="No tasks found" />
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard
                    key={task.taskId}
                    task={task}
                    handleEdit={() => handleEditTask(task)}
                    handleDelete={() => handleDeleteTask(task.taskId)}
                  />
                ))
              )}
            </div>
          ))}
      </div>
  );
};

export default TaskManagement;
