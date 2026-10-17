import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import { fetchQuotationsAPI, approveQuotationAPI, rejectQuotationAPI, submitQuotationAPI, reopenQuotationAPI, deleteQuotationAPI } from "../services/quotation.api";

export const useQuotations = ({ page = 1, limit = 10, search = "", status = "" } = {}) => {
  const [quotations, setQuotations] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const requestVersion = useRef(0);
  const mounted = useRef(true);
  const refreshCurrent = useRef(null);
  const fetchData = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchQuotationsAPI({ page, limit, search, status });
      if (version !== requestVersion.current) return false;
      setQuotations(data.quotations || []);
      setTotalItems(data.total || 0);
      setTotalPages(Math.max(1, data.totalPages || 1));
      return true;
    } catch (failure) {
      if (version === requestVersion.current) {
        setError({ status: failure.response?.status, message: failure.response?.data?.message || "Unable to load quotations. Please try again." });
        if ([403, 404].includes(failure.response?.status)) {
          setQuotations([]);
          setTotalItems(0);
        }
      }
      return false;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [page, limit, search, status]);
  refreshCurrent.current = fetchData;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    void fetchData();
    const onFocus = () => {
      if (document.visibilityState !== "hidden" && !pendingRef.current) void fetchData();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      requestVersion.current += 1;
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchData]);
  const mutate = async (request, message) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    requestVersion.current += 1;
    try {
      await request();
      if (!mounted.current) return;
      toast.success(message);
      // Action responses are headers: refetch populated rows and filter counts.
      await refreshCurrent.current();
    } catch (failure) {
      if (mounted.current && [400, 403, 404, 409].includes(failure.response?.status)) await refreshCurrent.current();
      throw failure;
    } finally {
      pendingRef.current = false;
      if (mounted.current) setPending(false);
    }
  };
  return {
    quotations, totalPages, totalItems, loading, error, pending,
    approve: (q) => mutate(() => approveQuotationAPI(q._id), "Quotation approved"),
    reject: (q, reason) => mutate(() => rejectQuotationAPI(q._id, reason), "Quotation rejected"),
    submit: (q) => mutate(() => submitQuotationAPI(q._id), "Quotation submitted"),
    reopen: (q) => mutate(() => reopenQuotationAPI(q._id), "Quotation returned to draft"),
    remove: (q) => mutate(() => deleteQuotationAPI(q._id), "Quotation deleted"),
    refresh: fetchData,
  };
};
