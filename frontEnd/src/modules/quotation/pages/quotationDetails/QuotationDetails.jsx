import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchQuotationAPI } from "../../services/quotation.api";
import { useAuth } from "../../../auth/useAuth";
import { canAccessQuotation } from "../../quotation.access";
import QuotationDetailsHeader from "./components/QuotationDetailsHeader";
import QuotationPreview from "./components/QuotationPreview";
import QuotationWorkflowActions from "./components/QuotationWorkflowActions";

const QuotationDetails = ({ role = "admin" }) => {
  const navigate = useNavigate();
  const { quotationId } = useParams();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const requestVersion = useRef(0);
  const actionPending = useRef(false);
  // A different route must never render the previous quotation while loading.
  const quotation = record?.id === quotationId ? record.quotation : null;
  const error = record?.id === quotationId ? record.error : null;
  const listRoute = role === "admin" ? "/admin/quotations" : "/employee/quotations";

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const { data } = await fetchQuotationAPI(quotationId);
      if (version !== requestVersion.current) return false;
      if (!canAccessQuotation(user, data.quotation)) {
        setRecord({ id: quotationId, quotation: null, error: { status: 404, message: "Quotation not found" } });
        return false;
      }
      setRecord({ id: quotationId, quotation: data.quotation, error: null });
      return true;
    } catch (failure) {
      if (version === requestVersion.current) {
        const denied = [401, 403, 404].includes(failure.response?.status);
        setRecord(previous => ({
          id: quotationId,
          quotation: !denied && previous?.id === quotationId ? previous.quotation : null,
          error: { status: failure.response?.status, message: failure.response?.data?.message || "Unable to load quotation. Please try again." },
        }));
      }
      return false;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [quotationId, user]);

  useEffect(() => {
    actionPending.current = false;
    setBusy(false);
    void refresh();
    const onFocus = () => {
      if (document.visibilityState !== "hidden" && !actionPending.current) void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      requestVersion.current += 1;
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  const onBusyChange = (pending) => {
    actionPending.current = pending;
    setBusy(pending);
    // Discard a read started before a business action.
    if (pending) requestVersion.current += 1;
  };

  return (
    <div className="flex min-w-0 flex-col gap-5 pb-8">
      <QuotationDetailsHeader quotation={quotation} role={role} user={user} busy={busy || loading}
        onBack={() => navigate(listRoute)} />
      <div className="flex justify-end">
        <button type="button" onClick={refresh} disabled={loading || busy}
          className="rounded-xl border border-border-color px-4 py-2 text-sm text-text disabled:opacity-50">Refresh</button>
      </div>
      {error && <div role="alert" className="rounded-xl border border-red p-4 text-sm text-text">
        <p>{error.status === 404 ? "Quotation not found or no longer available to you."
          : error.status === 403 ? "You do not have permission to view this quotation." : error.message}</p>
        <button type="button" onClick={refresh} disabled={loading || busy} className="mt-2 underline">Retry</button>
      </div>}
      {loading && !quotation && <div role="status" className="p-10 text-center text-sm text-gray-500">Loading quotation...</div>}
      {quotation && <div aria-busy={loading || busy}>
        {/* Saved backend values are authoritative, including historical amounts. */}
        <QuotationPreview quotation={quotation} totals={quotation} />
        <QuotationWorkflowActions key={quotationId} quotation={quotation} user={user}
          disabled={loading} onChanged={refresh} onBusyChange={onBusyChange} />
      </div>}
    </div>
  );
};

export default QuotationDetails;
