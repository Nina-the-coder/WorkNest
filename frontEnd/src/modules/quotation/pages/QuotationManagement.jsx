// modules/quotation/pages/QuotationManagement.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../shared/components/Header";
import VariantButton from "../../../shared/components/buttons/VariantButton";
import QuotationCard from "../components/QuotationCard";
import QuotationTable from "../components/QuotationTable";
import PaginationControls from "../../../shared/components/PaginationControls";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import NoItemFoundModal from "../../../shared/components/NoItemFoundModal";
import useDebounce from "../../../shared/hooks/useDebounce";
import { useQuotations } from "../hooks/useQuotations";

const QuotationManagement = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 450);
  const [statusFilter, setStatusFilter] = useState("");
  const [tableView, setTableView] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const {
    quotations,
    totalPages,
    totalItems,
    loading,
    approve,
    reject,
    remove,
    makeOrder,
  } = useQuotations({
    page,
    limit,
    search: debouncedSearch,
    status: statusFilter,
  });

  return (
    <div className="flex flex-col">
      <Header title="Quotation Management" />

      <div className="flex justify-end my-4">
        <VariantButton
          onClick={() => setTableView(!tableView)}
          variant="ghostCta"
          size="medium"
          text={tableView ? "Card" : "Table"}
        />
      </div>

      {loading ? (
        <SkeletonLoader count={6} />
      ) : quotations.length === 0 ? (
        <NoItemFoundModal message="No quotations found" />
      ) : tableView ? (
        <QuotationTable
          quotations={quotations}
          editQuotation={(e, q) =>
            navigate("/admin/add-quotation", {
              state: { mode: "edit", quotation: q },
            })
          }
          deleteQuotation={(e, id) => remove(id)}
          approveQuotation={(e, q) => approve(q)}
          rejectQuotation={(e, q) => reject(q)}
          makeOrder={(e, q) => makeOrder(q, user._id)}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-4">
            {quotations.map((quotation) => (
              <QuotationCard
                key={quotation.quotationId}
                quotation={quotation}
                approveQuotation={(e) => approve(quotation)}
                rejectQuotation={(e) => reject(quotation)}
                deleteQuotation={(e) =>
                  remove(quotation.quotationId)
                }
                makeOrder={(e) =>
                  makeOrder(quotation, user._id)
                }
              />
            ))}
          </div>

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
      )}
    </div>
  );
};

export default QuotationManagement;