import React from "react";
import Sidebar from "../components/Sidebar";

const EmployeeManagement = () => {
    const addNewEmployee = () => {
        console.log("Add New Employee");
    }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center">
        {/* header */}
        <div className="w-full flex justify-between">
          <div className="text-3xl">Employee Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* Search Bar and CTA button */}
        <div className="flex justify-between my-16 px-10 h-20 w-full">
          <div className="h-full w-3/4 items-center flex">
            <input type="text" className="border h-10 w-3/4" />
          </div>
          <div className="h-full w-1/4 items-center flex">
            <button className="border p-8 text-xl rounded-xl" onClick={addNewEmployee}>
              Add new Employee
            </button>
          </div>
        </div>

        {/* container */}
        <div className="w-11/12 bg-gray-400 h-full">

        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;