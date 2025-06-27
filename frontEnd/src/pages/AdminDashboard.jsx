import React from "react";
import Sidebar from "../components/Sidebar";

const AdminDashboard = () => {
  const items = [
    { name: "Pending Tasks", count: 3 },
    { name: "Quotations given", count: 5 },
    { name: "Confirmed orders", count: 2 },
    { name: "Current Conversations", count: 4 },
  ];
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4">
        {/* header */}
        <div className="flex justify-between">
          <div className="text-3xl">Dashboard</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* cards */}
        <div className="flex flex-wrap justify-around mt-14">
          {items.map((item, index) => (
            <div key={index} className="flex flex-col justify-between items-center border p-1 mb-4 mr-4 h-40 w-60">
              <div className="text-2xl text-center">{item.name}</div>
              <div className="text-5xl mb-8">{item.count}</div>
            </div>
          ))}
        </div>

        {/* Tables */}
        <div className="flex justify-around mt-16 h-40 w-full">
          {/* left */}
          <div className="md:w-[48%] border">Confirmed Orders lol!</div>

          {/* right */}
          <div className="md:w-[48%] border">Current Conversations</div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
