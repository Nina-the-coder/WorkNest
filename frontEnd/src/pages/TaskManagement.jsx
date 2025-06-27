import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import EmployeeComboBox from "../components/EmployeeComboBox";

const TaskManagement = () => {
  const [formData, setFormData] = useState({
    employee: "",
    taskTitle: "",
    description: "",
    dueDate: "",
    status: "pending",
  });

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

  const handleSave = (e) => {
    e.preventDefault();

    // const { employee, taskTitle, dueDate } = formData;
    // if (!employee || !taskTitle || !dueDate) {
    //   alert("Please fill in all required fields.");
    //   return;
    // }
    setFormData({
      employee: "",
      taskTitle: "",
      description: "",
      dueDate: "",
      status: "pending", 
    });

    console.log("Task Added", formData);
    setModal(false);
  };

  const handleCancel = () => {
    setFormData({
      employee: "",
      taskTitle: "",
      description: "",
      dueDate: "",
      status: "pending", 
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
              <EmployeeComboBox />

              <label htmlFor="taskTitle" className="w-full text-lg">
                Task Title
              </label>
              <input
                type="text"
                id="taskTitle"
                name="taskTitle"
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
                className="w-1/2 mx-4 p-0.5 bg-white border"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In progress</option>
                <option value="done">Done</option>
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
        <div className="w-11/12 bg-gray-400 h-100"></div>
      </div>
    </div>
  );
};

export default TaskManagement;
