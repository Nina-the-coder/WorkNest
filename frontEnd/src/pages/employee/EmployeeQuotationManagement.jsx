import axios from "axios";
import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const EmployeeQuotationManagement = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    if (!user || user.role !== "employee") {
      navigate("/login");
    } else {
      fetchQuotation(user._id);
    }
  }, []);

  const fetchQuotation = async (empId) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/employee/quotation/${empId}`
      );
      setQuotations(res.data);
    } catch (err) {
      console.error("Error in fetching the quotations");
    }
  };

  const handleQuotationClick = (quotation) => {
    // Only allow edit if status is not approved
    if (quotation.status !== "approved") {
      navigate("/employee/quotation", {
        state: { mode: "edit", quotation },
      });
    } else {
      alert("Approved quotations cannot be edited.");
    }
  };

  const handleDeleteQuotation = (quotationId) => {
    console.log("deleting the quotation ", quotationId);
  };

  const updateQuotationStatus = async (quotationId) => {
    const updatedQuotation = quotations.find(
      (q) => q.quotationId === quotationId
    );

    if (updatedQuotation) {
      updatedQuotation.status = "ordered";

      // ✅ Update state immutably
      setQuotations((prev) =>
        prev.map((q) =>
          q.quotationId === quotationId ? { ...q, status: "ordered" } : q
        )
      );

      console.log("Updated Quotation:", updatedQuotation);
    } else {
      console.warn("Quotation not found for ID:", quotationId);
    }
  };

  const handleMakeOrder = async (quotation) => {
    if (quotation.status !== "approved") {
      alert("only Approved quotation can be converted to an order");
      return;
    }
    try {
      const res = await axios.post(
        `${BASE_URL}/api/employee/order`,
        { quotationId: quotation._id, addedBy: user._id},   /////////////////////////////////////////
        {
          headers: { Authorization: `bearer ${token}` },
        }
      );
      updateQuotationStatus(quotation.quotationId);

      console.log("making the order ", res.data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "An error occurred while making the order";
      console.log(message);
    }
  };

  return (
    <div className="w-120 h-100 ml-4 my-12 p-4 bg-slate-800 text-white flex flex-col justify-between">
      <div>
        <div className="text-xl font-semibold mb-4">My Quotations</div>

        {/* Quotation Cards */}
        <div className="h-70 overflow-auto space-y-2 pr-2">
          {quotations
            .filter((q) => q.status !== "ordered")
            .map((quotation) => (
              <div
                key={quotation.quotationId}
                className="cursor-pointer"
                onClick={() => handleQuotationClick(quotation)}
              >
                {/* quotation card content */}
                <div className="flex flex-col bg-slate-300 text-black p-3 rounded-md shadow">
                  {/* upper part */}
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="font-bold">QuotationId:</span>{" "}
                      {quotation.quotationId}
                    </div>
                    <div
                      className={`${
                        quotation.status === "approved"
                          ? "text-green-600"
                          : quotation.status === "pending"
                          ? "text-red-500"
                          : "text-shadow-black"
                      } font-semibold`}
                    >
                      {quotation.status}
                    </div>
                  </div>

                  {/* lower part */}
                  <div className="flex justify-between">
                    {/* left */}
                    <div>
                      <div>
                        <span className="font-bold">CustomerId:</span>{" "}
                        {quotation.customerId.name}
                      </div>
                      <div>
                        <span className="font-bold">Doctor's Status:</span>{" "}
                        {quotation.isApprovedByDoctor}
                      </div>
                      <div>
                        <span className="font-bold">Total:</span> ₹
                        {quotation.total}
                      </div>
                    </div>

                    {/* right */}
                    <div className="flex flex-col text-white">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuotation(quotation.quotationId);
                        }}
                        className="py-1 px-4 mb-2 bg-slate-600 hover:bg-indigo-900 hover:cursor-pointer"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMakeOrder(quotation);
                        }}
                        className="py-1 px-4 bg-slate-600 hover:bg-indigo-900 hover:cursor-pointer"
                      >
                        Make Order
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Add New Quotation Button */}
      <div className="mt-4 text-right flex justify-center">
        <Link
          to="/employee/quotation"
          className="bg-indigo-800 hover:bg-indigo-900 text-white py-1 px-4 shadow-md"
        >
          Add New Quotation
        </Link>
      </div>
    </div>
  );
};

export default EmployeeQuotationManagement;
