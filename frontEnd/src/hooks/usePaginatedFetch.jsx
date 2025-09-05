// hooks/usePaginatedFetch.js (optional reusable hook)
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function usePaginatedFetch({ url, params = {}, deps = [] }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(params.page || 1);
  const [limit, setLimit] = useState(params.limit || 10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(url, {
          params: { ...params, page, limit },
          signal: controller.signal,
        });
        // adapt to your backend naming
        setItems(res.data.quotations ?? res.data.items ?? res.data.customers ?? []);
        setTotal(res.data.total ?? 0);
        setTotalPages(res.data.totalPages ?? Math.ceil((res.data.total ?? 0) / limit));
      } catch (err) {
        if (err.name === 'CanceledError' || err.message === 'canceled') {
          // aborted
        } else {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPage();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, page, limit, ...deps]);

  return { items, setItems, page, setPage, limit, setLimit, totalPages, total, loading, error };
}
