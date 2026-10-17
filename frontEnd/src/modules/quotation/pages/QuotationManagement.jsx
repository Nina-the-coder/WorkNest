import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiChevronDown, FiSearch } from "react-icons/fi";
import Header from "../../../shared/components/Header";
import VariantButton from "../../../shared/components/buttons/VariantButton";
import PaginationControls from "../../../shared/components/PaginationControls";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import NoItemFoundModal from "../../../shared/components/NoItemFoundModal";
import useDebounce from "../../../shared/hooks/useDebounce";
import { useAuth } from "../../auth/useAuth";
import { useQuotations } from "../hooks/useQuotations";
import QuotationCard from "../components/QuotationCard";
import { STATUS_CONFIG } from "../constants/quotation.constants";
import QuotationTable from "../components/QuotationTable";
const STATUSES = Object.keys(STATUS_CONFIG);

const QuotationManagement = ({ role = "admin" }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debouncedSearch = useDebounce(search, 400);

  const {
    quotations,
    totalPages,
    totalItems,
    loading,
    error,
    pending,
    refresh,
    approve,
    reject,
    submit,
    reopen,
    remove,
  } = useQuotations({
    page,
    limit,
    search: debouncedSearch,
    status,
  });

  useEffect(() => {
    if (!loading && !error && page > totalPages) setPage(totalPages);
  }, [loading, error, page, totalPages]);

  /* ------------------------------------------------------------------------ */
  /* Actions                                                                  */
  /* ------------------------------------------------------------------------ */

  const doReject = async (quotation) => {
    const reason = window.prompt("Why is this quotation being rejected?");

    if (reason === null) return;

    if (!reason?.trim()) {
      return toast.warn("A rejection reason is required");
    }

    try {
      await reject(quotation, reason);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to reject quotation",
      );
    }
  };

  const run = async (fn, quotation) => {
    try {
      await fn(quotation);
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Create route                                                             */
  /* ------------------------------------------------------------------------ */

  const handleCreate = () => {
    navigate(role === "admin" ? "/admin/add-quotation" : "/employee/quotation");
  };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-8">
      {/* Header */}
      <Header title={role === "employee" ? "My Quotations" : "Quotation Management"} />

      {/* Toolbar */}
      <div className="rounded-2xl border border-border-color bg-card-bg p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search + filter */}
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
            {/* Search */}
            <div className="relative min-w-0 sm:w-72">
              <FiSearch
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />

              <input
                className="h-10 w-full rounded-xl border border-border-color bg-bg pl-9 pr-3 text-sm text-text outline-none transition placeholder:text-gray-400 focus:border-cta focus:ring-2 focus:ring-cta/10"
                placeholder="Search quotation number..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>

            {/* Status */}
            <div className="relative sm:w-44">
              <select
                className="h-10 w-full appearance-none rounded-xl border border-border-color bg-bg px-3 pr-9 text-sm text-text outline-none transition focus:border-cta focus:ring-2 focus:ring-cta/10"
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="">All statuses</option>

                {STATUSES.map((quotationStatus) => (
                  <option key={quotationStatus} value={quotationStatus}>
                    {STATUS_CONFIG[quotationStatus].label}
                  </option>
                ))}
              </select>

              <FiChevronDown
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
            </div>
          </div>

          {/* Create */}
          <div className="flex items-center gap-3">
          <button type="button" onClick={refresh} disabled={loading || pending}
            className="rounded-xl border border-border-color px-4 py-2 text-sm text-text disabled:opacity-50">Refresh</button>
          {user?.permissions?.includes("QUOTATION_CREATE") && (
            <VariantButton
              onClick={handleCreate}
              variant="cta"
              size="medium"
              text="New quotation"
              icon="plus"
            />
          )}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div className="mt-4 border-t border-border-color pt-3">
            <p className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-medium text-text">{quotations.length}</span>{" "}
              of <span className="font-medium text-text">{totalItems}</span>{" "}
              quotations
            </p>
          </div>
        )}
      </div>

      {error && <div role="alert" className="rounded-xl border border-red p-4 text-sm text-text">
        <p>{error.status === 403 ? "You do not have permission to view quotations." : error.message}</p>
        <button type="button" onClick={refresh} disabled={loading || pending} className="mt-2 underline">Retry</button>
      </div>}

      {/* Content */}
      {loading ? (
        <div className="rounded-2xl border border-border-color bg-card-bg p-4 sm:p-6">
          <SkeletonLoader count={6} />
        </div>
      ) : quotations.length === 0 && !error ? (
        <div className="rounded-2xl border border-border-color bg-card-bg p-4 sm:p-6">
          <NoItemFoundModal message="No quotations found" />
        </div>
      ) : quotations.length > 0 ? (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* Desktop Table                                                   */}
          {/* ---------------------------------------------------------------- */}

          <QuotationTable
            quotations={quotations}
            role={role}
            navigate={navigate}
            run={run}
            doReject={doReject}
            submit={submit}
            approve={approve}
            reopen={reopen}
            remove={remove}
            user={user}
            pending={pending}
          />

          {/* ---------------------------------------------------------------- */}
          {/* Mobile / Tablet Cards                                            */}
          {/* ---------------------------------------------------------------- */}

          <div className="grid gap-3 xl:hidden">
            {quotations.map((q) => (
              <QuotationCard
                key={q._id}
                quotation={q}
                role={role}
                navigate={navigate}
                run={run}
                doReject={doReject}
                submit={submit}
                approve={approve}
                reopen={reopen}
                remove={remove}
                user={user}
                pending={pending}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="rounded-2xl border border-border-color bg-card-bg p-3 sm:p-4">
            <PaginationControls
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              limit={limit}
              setLimit={(value) => {
                setLimit(value);
                setPage(1);
              }}
              totalItems={totalItems}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default QuotationManagement;
