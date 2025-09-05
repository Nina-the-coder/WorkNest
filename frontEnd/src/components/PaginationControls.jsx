// components/PaginationControls.jsx
import React from 'react';

const PaginationControls = ({ page, setPage, totalPages, setLimit, limit }) => {
  const pagesToShow = 5; // sliding window
  const half = Math.floor(pagesToShow / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + pagesToShow - 1);
  if (end - start + 1 < pagesToShow) start = Math.max(1, end - pagesToShow + 1);

  const pageNumbers = [];
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="flex items-center gap-3 mt-4">
      <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">First</button>
      <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>

      {start > 1 && <span className="px-2">...</span>}
      {pageNumbers.map((p) => (
        <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded ${p === page ? 'bg-cta text-white' : 'border'}`}>
          {p}
        </button>
      ))}
      {end < totalPages && <span className="px-2">...</span>}

      <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
      <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">Last</button>

      <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="ml-4 border rounded px-2 py-1">
        <option value={10}>10 / page</option>
        <option value={20}>20 / page</option>
        <option value={50}>50 / page</option>
        <option value={100}>100 / page</option>
      </select>
    </div>
  );
};

export default PaginationControls;
