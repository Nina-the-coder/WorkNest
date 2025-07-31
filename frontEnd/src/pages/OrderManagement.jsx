import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const OrderManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/orders`);
      setOrders(res.data);
      console.log("orders being fetched", res.data);
    } catch (err) {
      console.error("Error in fetching the orders from the server", err);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col bg-slate-900">
        {/* header */}
        <div className="w-full flex justify-between text-white">
          <div className="text-3xl">Order Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* Search Bar and CTA button */}
        <div className="flex my-16 px-10 h-20 w-full">
          <div className="h-full w-1/2 items-center flex">
            <input
              type="text"
              className="h-10 w-3/4 bg-white px-2"
              placeholder="Search for a Quotation"
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
              <option value="active">active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* container */}
        <div className="h-120 w-fit flex flex-col overflow-auto px-4 pb-4 ml-4">
          {/* cards */}
          {orders.map((order) => (
            <div 
              className="w-200 min-h-30 bg-slate-800 text-slate-300 p-4 text-lg flex"
              key={order.orderId}
            >
              
              {/* left */}
              <div className="flex flex-col mr-40">
                <div>{order.orderId} - {order.quotationId?.customerId?.customerId}</div>
                <div>Dispatch Date : {order.dispatchDate}</div>
              </div>

              {/* right */}
              <div className="">dispatched</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
