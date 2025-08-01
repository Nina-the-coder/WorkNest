import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const QuotationManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleAddNewQuotation = () => {
    console.log("Adding new quotation");
    navigate("/admin/add-quotation");
  };

  const fetchQuotations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/quotations`);
      setQuotations(res.data);
      console.log("Quotations", res.data);
    } catch (err) {
      console.error(
        "Error in fetching the quotations from the serrver...",
        err
      );
    }
  };
  
  const handleApproveQuotation = async (e, quotation) => {
    console.log("approve quotation");
  };
  
  const handleRejectQuotation = async (e, quotation) => {
    console.log("reject quotation");
  };

  const handleEditQuotation = async (quotation) => {
    navigate("/admin/add-quotation", {
      state: { mode: "edit", quotation },
    });
  };

  const handleDeleteQuotation = async(quotationId) => {
    console.log("deleting the quotation", quotationId);
  }

  const handleMakeOrder = async (e, quotation) => {
    console.log("making order", quotation);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col bg-slate-900">
        {/* header */}
        <div className="w-full flex justify-between text-white">
          <div className="text-3xl">Qutotation Management</div>
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
          <div className="h-full w-1/4 items-center flex ml-20">
            <button
              className="w-full p-8 text-2xl rounded-xl text-white bg-indigo-800 hover:cursor-pointer hover:bg-indigo-900"
              onClick={handleAddNewQuotation}
            >
              Add new Quotation
            </button>
          </div>
        </div>

        {/* container */}
        <div className="h-120 w-fit flex flex-col overflow-auto px-4 pb-4 ml-4">
          {/* card */}
          {quotations.map((quotation) => (
            <div
              className="min-h-30 w-250 bg-slate-800 mt-4 flex justify-between text-slate-300 p-4 text-lg hover:cursor-pointer"
              key={quotation.quotationId}
            >
              {/* 1st */}
              <div className="flex flex-col justify-between w-1/2">
                <div className="text-white flex justify-between">
                  <div>
                    {quotation.quotationId} - {quotation.customerId?.customerId}
                  </div>
                  <div
                    className={`ml-30 text-black py-0.5 px-4 rounded-xl ${
                      quotation.status === "pending"
                        ? "bg-amber-500"
                        : quotation.status === "approved"
                        ? "bg-emerald-500"
                        : "bg-rose-500"
                    }`}
                  >
                    {quotation.status}
                  </div>
                </div>
                <div>Added By: {quotation.addedBy?.name}</div>
                <div>Doctor's status: {quotation.isApprovedByDoctor}</div>
              </div>

              {/* 2nd */}
              <div className="flex flex-col-reverse">
                <div className="text-white">Total - {quotation.total}</div>
              </div>

              {/* 3rd */}
              <div className="flex flex-col justify-between">
                <button
                  className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
                  onClick={(e) => handleApproveQuotation(e, quotation)}
                >
                  Approve
                </button>
                <button
                  className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
                  onClick={(e) => handleRejectQuotation(e, quotation)}
                >
                  Reject
                </button>
              </div>

              {/* 4th */}
              <div className="flex flex-col justify-between">
                <button
                  className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
                  onClick={(e) => handleEditQuotation(e, quotation)}
                >
                  Edit
                </button>
                <button
                  className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
                  onClick={(e) => handleDeleteQuotation(e, quotation)}
                >
                  Delete
                </button>
              </div>

              {/* 5th */}
              <div className="flex justify-center">
                <button
                  className="h-full w-20 bg-slate-700 cursor-pointer hover:bg-slate-600"
                  onClick={(e) => handleMakeOrder(e, quotation)}
                >
                  Make Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationManagement;
