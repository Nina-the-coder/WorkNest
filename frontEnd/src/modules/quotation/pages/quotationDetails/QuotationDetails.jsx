import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { fetchQuotationAPI } from "../../services/quotation.api";
import { calculateQuotationTotals } from "../../quotation.util";

import QuotationDetailsHeader from "./components/QuotationDetailsHeader";
import QuotationPreview from "./components/QuotationPreview";
import QuotationWorkflowActions from "./components/QuotationWorkflowActions";

const QuotationDetails = ({ role = "admin" }) => {
  const navigate = useNavigate();
  const { quotationId } = useParams();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------------------ */
  /* Load quotation                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const loadQuotation = async () => {
      setLoading(true);

      try {
        const { data } = await fetchQuotationAPI(quotationId);

        setQuotation(data.quotation);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to load quotation",
        );
      } finally {
        setLoading(false);
      }
    };

    if (quotationId) {
      loadQuotation();
    }
  }, [quotationId]);

  /* ------------------------------------------------------------------------ */
  /* Calculations                                                             */
  /* ------------------------------------------------------------------------ */

  const totals = useMemo(() => {
    if (!quotation) {
      return {
        subtotal: 0,
        discountAmount: 0,
        gstAmount: 0,
        grandTotal: 0,
      };
    }

    return calculateQuotationTotals(quotation.items || []);
  }, [quotation]);

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border-color border-t-cta" />

          <p className="mt-3 text-sm text-gray-500">Loading quotation...</p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Not found                                                                */
  /* ------------------------------------------------------------------------ */

  if (!quotation) {
    return (
      <div className="flex flex-col gap-5">
        <QuotationDetailsHeader
          quotation={null}
          role={role}
          onBack={() => navigate(-1)}
        />

        <div className="rounded-2xl border border-border-color bg-card-bg p-10 text-center">
          <p className="text-sm font-medium text-text">Quotation not found</p>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-3 text-sm font-medium text-cta hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-8">
      <QuotationDetailsHeader
        quotation={quotation}
        role={role}
        onBack={() => navigate(role === "admin" ? "/admin/quotations" : "/employee/quotations")}
      />

      <QuotationPreview quotation={quotation} totals={totals} />

      <QuotationWorkflowActions quotation={quotation} role={role} />
    </div>
  );
};

export default QuotationDetails;
