import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import CTAButton from "../components/buttons/CTAButton";
import QuotationCard from "../components/cards/QuotationCard";
import { toast } from "react-toastify";
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
    e.stopPropagation();
    if (quotation.status === "approved") {
      toast.warn("You have already approved the quotation");
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
    e.stopPropagation();

    if (quotation.status === "rejected") {
      toast.warn("You have already rejected the quotation");
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
    e.stopPropagation();
  };

  const handleDeleteQuotation = async (e, quotationId) => {
    if (
      !window.confirm(
        `Are you sure you want to delete quotation ${quotationId}?`
      )
    ) {
      return;
    }
    e.stopPropagation();

    try {
      const res = await axios.delete(
        `${BASE_URL}/api/admin/quotations/${quotationId}`
      );
      setQuotations((prev) =>
        prev.filter((q) => q.quotationId !== quotationId)
      );
      toast.success("Quotation deleted successfully");
    } catch (err) {
      console.error("Error in deleting the quotation", err);
      toast.error("Error in deleting the quotation");
    }
  };

  const handleMakeOrder = async (e, quotation) => {
    e.stopPropagation();

    if (quotation.status !== "approved") {
      toast.warn("Only approved quotations can be converted to an order");
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/api/employee/order`,
        {
          quotationId: quotation._id,
          addedBy: user._id,
        },
        {
          headers: { Authorization: `bearer ${token}` },
        }
      );

      toast.success("Order created successfully");
      console.log("order created", res.data);
    } catch (err) {
      console.error("error in making the order", err);
      toast.error("Error in making the Order");
    }
  };

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesQuotation =
      quotation.quotationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quotation.customerId?.customerId &&
        quotation.customerId?.customerId
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (quotation.customerId?.name &&
        quotation.customerId?.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (quotation.addedBy?.name &&
        quotation.addedBy?.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (quotation.addedBy?.empId &&
        quotation.addedBy?.empId
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesFilter =
      statusFilter === "" ||
      quotation.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesQuotation && matchesFilter;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col bg-bg">
        {/* header */}
        <Header title="Quotation Management" />

        {/* Search Bar and CTA button */}
        <div className=" w-full my-10 py-4 px-10 flex sticky top-0 bg-bg z-50">
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
              <div className="text-left">Quotation</div>
            </CTAButton>
          </div>
        </div>

        {/* container */}
        <div className="h-fit w-fit flex flex-col  px-4 pb-4 ml-8">
          {/* card */}
          {filteredQuotations.map((quotation) => (
            <QuotationCard
              key={quotation.quotationId}
              quotation={quotation}
              editQuotation={(e) => handleEditQuotation(e, quotation)}
              deleteQuotation={(e) =>
                handleDeleteQuotation(e, quotation.quotationId)
              }
              approveQuotation={(e) => handleApproveQuotation(e, quotation)}
              rejectQuotation={(e) => handleRejectQuotation(e, quotation)}
              makeOrder={(e) => handleMakeOrder(e, quotation)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuotationManagement;
