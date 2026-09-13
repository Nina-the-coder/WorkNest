
const QuotationCompanyHeader = ({ quotation }) => {
  const formatQuotationDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="border-b border-border-color px-6 py-7 sm:px-10 sm:py-9">
      <div className="flex flex-col justify-between gap-8 sm:flex-row">
        {/* Company */}
        <div>
          <h1 className="text-2xl font-bold text-text">WorkNest</h1>

          <p className="mt-2 text-sm text-gray-500">Nina's Business</p>

          <p className="text-sm text-gray-500">+91 98765 43210</p>

          <p className="text-sm text-gray-500">GSTIN: 27AABCF1234D1Z5</p>
        </div>

        {/* Quotation */}
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
            Quotation
          </p>

          <h2 className="mt-1 text-2xl font-bold text-text">
            {quotation.quotationNumber || quotation.quotationId || "—"}
          </h2>

          <div className="mt-4 space-y-1">
            <p className="text-sm text-gray-500">
              Date:{" "}
              <span className="font-medium text-text">
                {formatQuotationDate(quotation.createdAt)}
              </span>
            </p>

            <p className="text-sm text-gray-500">
              Valid Until:{" "}
              <span className="font-medium text-text">
                {formatQuotationDate(quotation.validUntil)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationCompanyHeader;
