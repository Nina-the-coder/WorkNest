import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import CTAButton from "../components/buttons/CTAButton";
import QuotationCard from "../components/cards/QuotationCard";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const QuotationManagement = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
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
    e.preventDefault();
    if (quotation.status === "approved") {
      alert("You have already approved the quotation");
    }
    try {
      console.log("approve quotation");
      await axios.put(
        `${BASE_URL}/api/admin/quotations/${quotation.quotationId}`,
        {
          status: "approved",
        }
      );

      setQuotations((prev) =>
        prev.map((q) =>
          q.quotationId === quotation.quotationId
            ? { ...q, status: "approved" }
            : q
        )
      );
    } catch (err) {
      setError("Failed to approve the quotation");
      console.error("error in approving the quotation", err);
    }
  };

  const handleRejectQuotation = async (e, quotation) => {
    e.preventDefault();
    if (quotation.status === "rejected") {
      alert("You have already rejected the quotation");
    }
    try {
      console.log("reject quotation");
      await axios.put(
        `${BASE_URL}/api/admin/quotations/${quotation.quotationId}`,
        {
          status: "rejected",
        }
      );

      setQuotations((prev) =>
        prev.map((q) =>
          q.quotationId === quotation.quotationId
            ? { ...q, status: "rejected" }
            : q
        )
      );
    } catch (err) {
      setError("Failed to reject the quotation");
      console.error("error in rejecting the quotation", err);
    }
  };

  const handleEditQuotation = async (e, quotation) => {
    navigate("/admin/add-quotation", {
      state: { mode: "edit", quotation },
    });
  };

  const handleDeleteQuotation = async (e, quotationId) => {
    if (
      !window.confirm(
        `Are you sure you want to delete quotation ${quotationId}?`
      )
    ) {
      return;
    }
    console.log("deleting the quotation", quotationId);
    try {
      const res = await axios.delete(
        `${BASE_URL}/api/admin/quotations/${quotationId}`
      );
      setQuotations((prev) =>
        prev.filter((q) => q.quotationId !== quotationId)
      );
    } catch (err) {
      console.error("Error in deleting the quotation", err);
      setError("Error in deleting the quotation");
    }
  };

  const handleMakeOrder = async (e, quotation) => {
    if (quotation.status !== "approved") {
      alert("Only approved quotations can be converted to the order");
      return;
    }
    try {
      const res = await axios.post(
        `${BASE_URL}/api/employee/order`,
        { quotationId: quotation._id, addedBy: user._id },
        { headers: { Authorization: `bearer ${token}` } }
      );
    } catch (err) {
      console.error("error in making the order", err);
      setError("Error in making the Order");
    }

    console.log("making order", quotation);
  };

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesQuotation = quotation.quotationId
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesFilter =
      statusFilter === "" ||
      quotation.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesQuotation && matchesFilter;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center bg-bg">
        {/* header */}
        <Header title="Quotation Management" />

        {/* Search Bar and CTA button */}
        <div className=" w-full my-16 px-10 flex">
          <div className="flex gap-4">
            <SearchBar
              placeholder="Search for a Quotation"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="pending">pending</option>
            </FilterDropdown>
          </div>
          <div className="ml-20">
            <CTAButton onClick={handleAddNewQuotation} icon="plus">
              <div className="text-left mb-1">Add new</div>
              <div className="text-left">Task</div>
            </CTAButton>
          </div>
        </div>

        {/* container */}
        <div className="h-120 w-fit flex flex-col overflow-auto px-4 pb-4 ml-4">
          {/* card */}
          {filteredQuotations.map((quotation) => (
            <QuotationCard />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationManagement;
