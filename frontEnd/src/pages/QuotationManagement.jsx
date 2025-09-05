import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import FilterDropdown from "../components/FilterDropdown";
import CTAButton from "../components/buttons/CTAButton";
import VariantButton from "../components/buttons/VariantButton";
import QuotationCard from "../components/cards/QuotationCard";
import QuotationTable from "../components/tables/QuotationTable";
import NoItemFoundModal from "../components/NoItemFoundModal";
import { toast } from "react-toastify";
import useDebounce from "../hooks/useDebounce";
import SkeletonLoader from "../components/SkeletonLoader";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const QuotationManagement = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [quotations, setQuotations] = useState([]);
  const [tableView, setTableView] = useState(false); // toggle

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 450);

  const navigate = useNavigate();

  useEffect(() => {
    setPage(1); // reset to first page on new search or filter
    fetchQuotations({
      page: 1,
      limit,
      search: debouncedSearch,
      status: statusFilter,
    });
  }, [debouncedSearch, statusFilter, limit]);

  const fetchQuotations = async ({
    page = 1,
    limit = 10,
    search = "",
    status = "",
  } = {}) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/admin/quotations`, {
        params: { page, limit, search, status },
        headers: { Authorization: `Bearer ${token}` }, // if protected
      });
      setQuotations(res.data.quotations);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch (err) {
      console.error("Error fetching quotations", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewQuotation = () => {
    navigate("/admin/add-quotation");
  };

  const handleApproveQuotation = async (e, quotation) => {
    e.preventDefault();
    e.stopPropagation();

    if (quotation.status === "approved") {
      toast.warn("You have already approved this quotation");
      return;
    }
    try {
      await axios.put(
        `${BASE_URL}/api/admin/quotations/${quotation.quotationId}`,
        { status: "approved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuotations((prev) =>
        prev.map((q) =>
          q.quotationId === quotation.quotationId
            ? { ...q, status: "approved" }
            : q
        )
      );
    } catch (err) {
      setError("Failed to approve quotation");
    }
  };

  const handleRejectQuotation = async (e, quotation) => {
    e.preventDefault();
    e.stopPropagation();

    if (quotation.status === "rejected") {
      toast.warn("You have already rejected this quotation");
      return;
    }
    try {
      await axios.put(
        `${BASE_URL}/api/admin/quotations/${quotation.quotationId}`,
        { status: "rejected" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuotations((prev) =>
        prev.map((q) =>
          q.quotationId === quotation.quotationId
            ? { ...q, status: "rejected" }
            : q
        )
      );
    } catch (err) {
      setError("Failed to reject quotation");
    }
  };

  const handleEditQuotation = (e, quotation) => {
    e.stopPropagation();
    navigate("/admin/add-quotation", {
      state: { mode: "edit", quotation },
    });
  };

  const handleDeleteQuotation = async (e, quotationId) => {
    e.stopPropagation();
    if (!window.confirm(`Delete quotation ${quotationId}?`)) return;

    try {
      await axios.delete(`${BASE_URL}/api/admin/quotations/${quotationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuotations((prev) =>
        prev.filter((q) => q.quotationId !== quotationId)
      );
      toast.success("Quotation deleted successfully");
    } catch (err) {
      toast.error("Error deleting quotation");
    }
  };

  const handleMakeOrder = async (e, quotation) => {
    e.stopPropagation();

    if (quotation.status !== "approved") {
      toast.warn("Only approved quotations can be converted into orders");
      return;
    }

    try {
      await axios.post(
        `${BASE_URL}/api/employee/order`,
        {
          quotationId: quotation._id,
          addedBy: user._id,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order created successfully");
    } catch (err) {
      toast.error("Error creating order");
    }
  };

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
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

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="ml-64 w-full p-4 flex flex-col bg-bg">
        <Header title="Quotation Management" />

        {/* Search, Filter, CTA, Toggle */}
        <div className="flex py-4 my-10 px-10 w-full sticky top-0 bg-bg z-50 justify-between">
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
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </FilterDropdown>

            <CTAButton onClick={handleAddNewQuotation} icon="plus">
              <div className="text-left mb-1">Add new</div>
              <div className="text-left">Quotation</div>
            </CTAButton>
          </div>

          <div className="flex gap-6 items-center">
            <VariantButton
              onClick={() => setTableView(!tableView)}
              variant="ghostCta"
              size="medium"
              text={tableView ? "Card" : "Table"}
              icon={tableView ? "layout-grid" : "table"}
            />
          </div>
        </div>

        {/* Container */}
        {tableView ? (
          <QuotationTable
            quotations={filteredQuotations}
            editQuotation={handleEditQuotation}
            deleteQuotation={handleDeleteQuotation}
            approveQuotation={handleApproveQuotation}
            rejectQuotation={handleRejectQuotation}
            makeOrder={handleMakeOrder}
          />
        ) : loading ? (
          <div className="w-full p-4 gap-4">
            <SkeletonLoader count={6} className="flex flex-wrap gap-4" />
          </div>
        ) : (
          <div className="w-full p-2 flex flex-wrap gap-4">
            {filteredQuotations.length === 0 ? (
              <NoItemFoundModal message="No quotations found" />
            ) : (
              filteredQuotations.map((quotation) => (
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
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationManagement;
