import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { fetchQuotationsAPI, approveQuotationAPI, rejectQuotationAPI, submitQuotationAPI, reopenQuotationAPI, deleteQuotationAPI } from "../services/quotation.api";

export const useQuotations = ({ page, limit, search, status }) => {
  const [quotations, setQuotations] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fetchQuotationsAPI({ page, limit, search, status });
      setQuotations(data.quotations || []); setTotalItems(data.total || 0); setTotalPages(data.totalPages || 1);
    } catch (error) { toast.error(error.response?.data?.message || "Failed to fetch quotations"); }
    finally { setLoading(false); }
  }, [page, limit, search, status]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const replace = (updated) => setQuotations((current) => current.map((q) => q._id === updated._id ? updated : q));
  const approve = async (q) => { const { data } = await approveQuotationAPI(q._id); replace(data.quotation); toast.success("Quotation approved"); };
  const reject = async (q, reason) => { const { data } = await rejectQuotationAPI(q._id, reason); replace(data.quotation); toast.success("Quotation rejected"); };
  const submit = async (q) => { const { data } = await submitQuotationAPI(q._id); replace(data.quotation); toast.success("Quotation submitted"); };
  const reopen = async (q) => { const { data } = await reopenQuotationAPI(q._id); replace(data.quotation); toast.success("Quotation returned to draft"); };
  const remove = async (q) => { await deleteQuotationAPI(q._id); toast.success("Quotation deleted"); fetchData(); };
  return { quotations, totalPages, totalItems, loading, approve, reject, submit, reopen, remove, refresh: fetchData };
};
