import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const EmployeeOrderManagement = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "employee") {
      navigate("/login");
    } else {
      fetchOrders(user._id);
    }
  }, []);

  const fetchOrders = async (empId) => {
    try {
      const res = await api.get(`${BASE_URL}/api/employee/order/${empId}`);
      setOrders(res.data);
      console.log("ORders beign fetched ", res.data);
    } catch (err) {
      console.error("Error in fetching the orders");
    }
  };

  const handleOrderClick = (order) => {
    alert(`Order clicked: ${order.orderId}`);
  };

  return (
    <div className="w-120 h-100 my-12 p-4 bg-slate-800 text-white flex flex-col justify-between">
      <div>
        <div className="text-xl font-semibold mb-4">Orders</div>
        {/* cards */}
        <div className="h-70 overflow-auto space-y-2 pr-2">
          {orders.map((order) => (
            <div
              key={order.orderId}
              className="cursor-pointer"
              onClick={() => handleOrderClick(order)}
            >
              {/* quotation card content */}
              <div className="flex flex-col bg-slate-300 text-black p-3 rounded-md shadow">
                <div>
                  <span className="font-bold">OrderId :</span> {order?.orderId}
                </div>
                <div>
                  <span className="font-bold">CustomerId :</span>{" "}
                  {order?.quotationId?.customerId?.customerId || "N/A"}
                </div>

                <div>
                  <span className="font-bold">Status :</span> {order.status}
                </div>
                <div>
                  <span className="font-bold">Dispatched Date :</span>
                  {order.dispatchDate
                    ? new Date(order.dispatchDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "N/A"}{" "}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* <div className="flex justify-center items-center">
        <button
          className="py-1 px-4 bg-indigo-800 hover:bg-indigo-900 hover:cursor-pointer"
          onClick={handleAddNewCustomer}
        >
          Add New Customer
        </button>
      </div> */}
    </div>
  );
};

export default EmployeeOrderManagement;
