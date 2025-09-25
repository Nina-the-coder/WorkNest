import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

const AdminDashboard = () => {
  const items = [
    {
      name: "Pending Tasks",
      count: 3,
      bg: "bg-yellow-100",
      text: "text-yellow-800",
    },
    {
      name: "Quotations given",
      count: 5,
      bg: "bg-blue-100",
      text: "text-blue-800",
    },
    {
      name: "Confirmed orders",
      count: 2,
      bg: "bg-green-100",
      text: "text-green-800",
    },
    {
      name: "Current Conversations",
      count: 4,
      bg: "bg-purple-100",
      text: "text-purple-800",
    },
  ];
  return (
    <div className="w-full p-4 bg-bg">
      {/* header */}
      <Header title="Dashboard" />

      {/* cards */}
      <div className="flex flex-wrap justify-around mt-14">
        {items.map((item, index) => (
          <div
            key={index}
            className={` h-40 w-60 flex flex-col justify-center items-center gap-8 mb-4 bg-card-bg rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300`}
          >
            <div className="text-[20px] text-center text-text/80 font-bold">
              {item.name}
            </div>
            <div className={`text-5xl ${item.text} font-bold`}>
              {item.count}
            </div>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="flex gap-8 p-8 h-[400px] w-full">
        {/* left */}
        <div className="w-full bg-card-bg/80 text-text rounded-2xl p-4 shadow-md">
          Confirmed Orders lol!
        </div>

        {/* right */}
        <div className="w-full bg-card-bg/80 text-text rounded-2xl p-4 shadow-md">
          Current Conversations
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
