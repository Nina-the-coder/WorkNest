import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { Link } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const EmployeeDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const [error, setError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [customerModal, setCustomerModal] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    name: "",
    address: "",
    contact: "",
    gst: "",
    email: "",
    status: "active",
    companyType: "dealer",
    addedBy: user.empId,
  });

  useEffect(() => {
    if (user && user.role == "employee") {
      fetchEmployeeTasks(user.empId);
      fetchCustomers(user.empId);
    }
  }, []);

  const handleChange = (e) => {
    setCustomerFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const fetchEmployeeTasks = async (empId) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/employee/tasks/${empId}`);
      setTasks(res.data);
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
      setTasks((prevTasks) => prevTasks.filter((t) => t.taskId !== taskId));
    } catch (err) {
      console.error("Error in deleting the task....", err);
    }
  };

  const fetchCustomers = async (empId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/employee/customers/${empId}`
      );
      setCustomers(res.data);
    } catch (err) {
      console.error("Error in fetching the customers...");
    }
  };

  const handleCancelCustomer = () => {
    setCustomerFormData({
      name: "",
      address: "",
      contact: "",
      gst: "",
      email: "",
      status: "active",
      companyType: "dealer",
    });

    console.log("cancelled");
    setCustomerModal(false);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${BASE_URL}/api/admin/customers`,
        customerFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Sending the customers data", res.data);
      setCustomerFormData({
        name: "",
        address: "",
        contact: "",
        gst: "",
        email: "",
        status: "active",
        companyType: "dealer",
      });
      fetchCustomers();
      setCustomerModal(false);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "An error occured whille saving the customer's data";
      setError(message);
    }
  };

  const handleAddNewCustomer = async () => {
    setCustomerModal(true);
  };

  const handleAddNewQuotation = () => {};

  return (
    <div>
      <Navbar />
      {/* main */}
      <div className="flex flex-wrap justify-evenly bg-slate-900 min-h-screen">
        {/* tasks */}
        {!customerModal && (
          <div className="w-200 h-120 mt-12 p-4 bg-slate-800 text-white">
            <div className="h-10 text-2xl">My Tasks</div>
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
        )}

        {/* notifications */}
        {!customerModal && (
          <div className="w-140 h-100 mt-12 p-4 bg-slate-800 text-white">
            <div>Notification</div>
          </div>
        )}

        {/* quotations */}
        {!customerModal && (
          <div className="w-120 h-100 mt-12 p-4 bg-slate-800 text-white">
            <div>My Quotations</div>
            <div className="">
              <Link
                className="text-white bg-indigo-800 hover:bg-indigo-900 hover:cursor-pointer py-0.5 px-4"
                to={"/employee/quotation"}
              >
                Add New Quotation
              </Link>
            </div>
          </div>
        )}

        {/* orders */}
        {!customerModal && (
          <div className="w-120 h-100 my-12 p-4 bg-slate-800 text-white">
            <div>Confirmed Orders</div>
          </div>
        )}

        {/* customers model */}
        {customerModal && (
          <div className="w-100 h-fit mt-16 p-8 bg-slate-800">
            <div className="text-3xl mb-8 ml-4 text-white">
              Add new Customer
            </div>
            <form>
              <label htmlFor="name" className="w-full text-lg text-slate-200">
                Customer Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={customerFormData.name}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label
                htmlFor="address"
                className="w-full text-lg text-slate-200"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={customerFormData.address}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label
                htmlFor="contact"
                className="w-full text-lg text-slate-200"
              >
                Contact
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={customerFormData.contact}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label htmlFor="gst" className="w-full text-lg text-slate-200">
                GST
              </label>
              <input
                type="text"
                id="gst"
                name="gst"
                value={customerFormData.gst}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label htmlFor="email" className="w-full text-lg text-slate-200">
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={customerFormData.email}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label htmlFor="status" className="text-lg text-slate-200">
                Status
              </label>
              <select
                name="status"
                id="status"
                onChange={handleChange}
                value={customerFormData.status}
                className="w-1/4 ml-2 mr-2 mt-4 p-0.5 bg-slate-200 border"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <label htmlFor="companyType" className="text-lg text-slate-200">
                Company
              </label>
              <select
                name="companyType"
                id="companyType"
                onChange={handleChange}
                value={customerFormData.companyType}
                className="w-1/4 ml-2 mr-2 p-0.5 bg-slate-200 border"
              >
                <option value="dealer">dealer</option>
                <option value="doctor">doctor</option>
              </select>

              {error && (
                <div className="text-rose-500 mb-2 text-sm mt-4">{error}</div>
              )}

              <div className="flex justify-around items-center mt-4">
                <button
                  onClick={handleCancelCustomer}
                  className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSaveCustomer}
                  className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
        {/* customers */}
        {!customerModal && (
          <div className="w-120 h-100 my-12 p-4 bg-slate-800 text-white flex flex-col justify-between">
            <div>
              <div className="my-2">Customers</div>
              {/* cards */}
              <div className="h-70 overflow-y-auto">
                {customers.map((customer) => (
                  <div
                    key={customer.customerId}
                    className="bg-slate-300 mb-2 text-black p-2"
                  >
                    <div className="font-bold">
                      {customer.customerId} - {customer.name}
                    </div>
                    <div>{customer.email}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center items-center">
              <button
                className="py-1 px-4 bg-indigo-800 hover:bg-indigo-900 hover:cursor-pointer"
                onClick={handleAddNewCustomer}
              >
                Add New Customer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
