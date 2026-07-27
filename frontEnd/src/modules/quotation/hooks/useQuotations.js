// modules/quotation/hooks/useQuotations.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  fetchQuotationsAPI,
  updateQuotationStatusAPI,
  deleteQuotationAPI,
  createOrderFromQuotationAPI,
} from "../services/quotation.api";

export const useQuotations = ({
  page,
  limit,
  search,
  status,
}) => {
  const [quotations, setQuotations] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);

    try {
      const res = await fetchQuotationsAPI(
        { page, limit, search, status },
        controller.signal
      );

      const {
        quotations: items = [],
        total = 0,
        totalPages: tp = 1,
      } = res.data;

      setQuotations(items);
      setTotalItems(total);
      setTotalPages(tp);
    } catch (err) {
      if (!axios.isCancel(err)) {
        toast.error("Failed to fetch quotations");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [page, limit, search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approve = async (quotation) => {
    if (quotation.status === "approved")
      return toast.warn("Already approved");

    await updateQuotationStatusAPI(
      quotation.quotationId,
      "approved"
    );

    setQuotations((prev) =>
      prev.map((q) =>
        q.quotationId === quotation.quotationId
          ? { ...q, status: "approved" }
          : q
      )
    );

    toast.success("Quotation approved");
  };

  const reject = async (quotation) => {
    if (quotation.status === "rejected")
      return toast.warn("Already rejected");

    await updateQuotationStatusAPI(
      quotation.quotationId,
      "rejected"
    );

    setQuotations((prev) =>
      prev.map((q) =>
        q.quotationId === quotation.quotationId
          ? { ...q, status: "rejected" }
          : q
      )
    );

    toast.success("Quotation rejected");
  };

  const remove = async (id) => {
    await deleteQuotationAPI(id);
    toast.success("Quotation deleted");
    fetchData();
  };

  const makeOrder = async (quotation, userId) => {
    if (quotation.status !== "approved")
      return toast.warn(
        "Only approved quotations can be converted"
      );

    await createOrderFromQuotationAPI({
      quotationId: quotation._id,
      addedBy: userId,
    });

    toast.success("Order created");
  };

  return {
    quotations,
    totalPages,
    totalItems,
    loading,
    approve,
    reject,
    remove,
    makeOrder,
  };
};