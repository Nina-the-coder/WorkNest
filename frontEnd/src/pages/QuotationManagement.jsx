import React, { useEffect, useState, useCallback } from "react";
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
import PaginationControls from "../components/PaginationControls";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const QuotationManagement = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 450);

  const [statusFilter, setStatusFilter] = useState("");
  const [quotations, setQuotations] = useState([]);
  const [tableView, setTableView] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    console.log("isMobile", isMobile);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // fetch function (uses AbortController to cancel stale requests)
  const fetchQuotations = useCallback(
    async ({ page = 1, limit = 10, search = "", status = "" } = {}) => {
      setLoading(true);
      const controller = new AbortController();
      try {
        const res = await axios.get(`${BASE_URL}/api/admin/quotations`, {
          params: { page, limit, search, status },
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const {
          quotations: items = [],
          total = 0,
          page: p = 1,
          totalPages: tp = 1,
        } = res.data;

        setQuotations(items);
        setTotalItems(total);
        setTotalPages(tp);
        setPage(p); // sync page with server response (safe)
        // if current page > totalPages (e.g., item deleted), adjust
        if (tp > 0 && page > tp) {
          setPage(tp);
        }
        console.log("Fetched quotations", res.data);
      } catch (err) {
        if (axios.isCancel(err)) {
          // expected on abort
        } else {
          console.error("Error fetching quotations", err);
          toast.error("Failed to fetch quotations");
        }
      } finally {
        setLoading(false);
      }

      // cleanup: return controller so caller can abort if necessary
      return () => controller.abort();
    },
    [token]
  );

  // main effect: fetch when page/limit/search/filter change
  useEffect(() => {
    fetchQuotations({
      page,
      limit,
      search: debouncedSearch,
      status: statusFilter,
    });
  }, [page, limit, debouncedSearch, statusFilter, fetchQuotations]);

  // When user types a new search or changes filter, reset to page 1 (do it in onChange handler)
  // handlers:
  const handleAddNewQuotation = () => navigate("/admin/add-quotation");

  const handleApproveQuotation = async (e, quotation) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (quotation.status === "approved") return toast.warn("Already approved");
    try {
      await axios.put(
        `${BASE_URL}/api/admin/quotations/${quotation.quotationId}`,
        { status: "approved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // optimistic update
      setQuotations((prev) =>
        prev.map((q) =>
          q.quotationId === quotation.quotationId
            ? { ...q, status: "approved" }
            : q
        )
      );
      toast.success("Quotation approved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to approve");
    }
  };

  const handleRejectQuotation = async (e, quotation) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (quotation.status === "rejected") return toast.warn("Already rejected");
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
      toast.success("Quotation rejected");
    } catch (err) {
      console.error(err);
      toast.error("Failed to reject");
    }
  };

  const handleEditQuotation = (e, quotation) => {
    e?.stopPropagation();
    navigate("/admin/add-quotation", { state: { mode: "edit", quotation } });
  };

  const handleDeleteQuotation = async (e, quotationId) => {
    e?.stopPropagation();
    if (!window.confirm(`Delete quotation ${quotationId}?`)) return;
    try {
      await axios.delete(`${BASE_URL}/api/admin/quotations/${quotationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Quotation deleted");
      // refetch the current page (to keep totals consistent)
      fetchQuotations({
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete quotation");
    }
  };

  const handleMakeOrder = async (e, quotation) => {
    e?.stopPropagation();
    if (quotation.status !== "approved")
      return toast.warn(
        "Only approved quotations can be converted into orders"
      );
    try {
      await axios.post(
        `${BASE_URL}/api/employee/order`,
        { quotationId: quotation._id, addedBy: user._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order created");
      // optionally refetch orders/quotations
    } catch (err) {
      console.error(err);
      toast.error("Failed to create order");
    }
  };

  // UI handlers: reset page to 1 when user updates search or filter
  const onSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };
  const onStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  return (
    <div className="w-full p-4 flex flex-col bg-bg">
      <Header title="Quotation Management" />

      {/* Search, Filter, CTA, Toggle */}
      <div className="flex flex-col gap-4 xl:flex-row py-4 my-10 px-10 w-full sticky top-0 bg-bg z-50 justify-between">
        <div className="flex gap-4">
        <div className="w-full lg:w-fit flex gap-4">

          <SearchBar
            placeholder="Search for a Quotation"
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
          <FilterDropdown value={statusFilter} onChange={onStatusChange}>
            <option value="">All Status</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
          </FilterDropdown>
        </div>

        <div className="flex gap-12 items-center lg:mr-10 justify-end">
          <CTAButton onClick={handleAddNewQuotation} icon="plus">
            <div className="text-left mb-1">Add new</div>
            <div className="text-left">Quotation</div>
          </CTAButton>
          {!isMobile && (
            <VariantButton
              onClick={() => setTableView(!tableView)}
              variant="ghostCta"
              size="medium"
              text={tableView ? "Card" : "Table"}
              icon={tableView ? "layout-grid" : "table"}
            />
          )}
        </div>
      </div>

      {/* Container */}
      <div className="px-6">
        {tableView ? (
          <>
            <QuotationTable
              quotations={quotations}
              editQuotation={handleEditQuotation}
              deleteQuotation={handleDeleteQuotation}
              approveQuotation={handleApproveQuotation}
              rejectQuotation={handleRejectQuotation}
              makeOrder={handleMakeOrder}
            />
            <PaginationControls
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              limit={limit}
              setLimit={(l) => {
                setLimit(l);
                setPage(1);
              }}
              totalItems={totalItems}
            />
          </>
        ) : loading ? (
          <div className="w-full p-4 gap-4">
            <SkeletonLoader count={6} className="flex flex-wrap gap-4" />
          </div>
        ) : (
          <>
            <div className="w-full p-2 flex flex-wrap gap-4">
              {quotations.length === 0 ? (
                <NoItemFoundModal message="No quotations found" />
              ) : (
                quotations.map((quotation) => (
                  <QuotationCard
                    key={quotation.quotationId}
                    quotation={quotation}
                    editQuotation={(e) => handleEditQuotation(e, quotation)}
                    deleteQuotation={(e) =>
                      handleDeleteQuotation(e, quotation.quotationId)
                    }
                    approveQuotation={(e) =>
                      handleApproveQuotation(e, quotation)
                    }
                    rejectQuotation={(e) => handleRejectQuotation(e, quotation)}
                    makeOrder={(e) => handleMakeOrder(e, quotation)}
                  />
                ))
              )}
            </div>

            <div className="mt-4">
              <PaginationControls
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                limit={limit}
                setLimit={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
                totalItems={totalItems}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuotationManagement;
