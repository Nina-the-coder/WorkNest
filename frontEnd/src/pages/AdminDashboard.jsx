import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { toast } from "react-toastify";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState({
    tasks: 0,
    quotations: 0,
    orders: 0,
    products: 0,
  });

  const fetchData = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/dashboard-metrics`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = res.data;
      setMetrics({
        tasks: data.pendingTasks,
        quotations: data.quotationsGiven,
        orders: data.confirmedOrders,
        products: data.products,
      });
      console.log(data);
    } catch (err) {
      console.error("Error fetching dashboard metrics:", err);
      toast.error("Failed to load dashboard metrics");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const items = [
    {
      name: "Pending Tasks",
      id: "tasks",
      bg: "bg-yellow-100",
      text: "text-yellow-800",
    },
    {
      name: "Quotations given",
      id: "quotations",
      bg: "bg-blue-100",
      text: "text-blue-800",
    },
    {
      name: "Confirmed orders",
      id: "orders",
      bg: "bg-green-100",
      text: "text-green-800",
    },
    {
      name: "Products",
      id: "products",
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
            className={` h-40 w-60 sm:w-52 md:w-60 flex flex-col justify-center items-center gap-8 mb-4 bg-card-bg rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300`}
          >
            <div className="text-[20px] text-center text-text/80 font-bold">
              {item.name}
            </div>
            <div className={`text-5xl ${item.text} font-bold`}>
              {metrics[item.id]}
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
