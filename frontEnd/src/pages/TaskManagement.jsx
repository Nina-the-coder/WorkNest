import React from "react";
import Sidebar from "../components/Sidebar";

const TaskManagement = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4">
        {/* header */}
        <div className="flex justify-between">
          <div className="text-3xl">Task Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* Search Bar and CTA button */}
        <div className="flex justify-between my-16 px-10 h-20 w-full">
          <div className="h-full w-3/4 items-center flex">
            <input type="text" className="border h-10 w-3/4" />
          </div>
          <div className="h-full w-1/4 items-center flex">
            <button className="border p-8 text-xl rounded-xl">
              Add new Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;
