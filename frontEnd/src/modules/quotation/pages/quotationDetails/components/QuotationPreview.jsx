import QuotationCompanyHeader from "./QuotationCompanyHeader";
import QuotationCustomerSection from "./QuotationCustomerSection";
import QuotationItemsTable from "./QuotationItemsTable";
import QuotationSummary from "./QuotationSummary";
import QuotationNotes from "./QuotationNotes";
import { formatDate } from "../../../quotation.util";

const QuotationPreview = ({ quotation, totals }) => {
  return (
    <div className="mx-auto w-full max-w-[1000px] overflow-hidden rounded-2xl border border-border-color bg-card-bg shadow-sm">
      <QuotationCompanyHeader quotation={quotation} />

      <div className="px-6 py-7 sm:px-10 sm:py-9">
        <QuotationCustomerSection quotation={quotation} />

        <QuotationItemsTable items={quotation.items || []} />

        <QuotationSummary totals={totals} />

        <QuotationNotes notes={quotation.notes} />

        {(quotation.submittedAt || quotation.approvedAt || quotation.rejectionReason) &&
          <section className="mt-8 space-y-4 border-t border-border-color pt-6" aria-label="Quotation review information">
            {quotation.submittedAt && <div className="text-sm text-gray-500">
              <p className="font-medium text-text">Submission</p>
              <p>{quotation.submittedBy?.name || "Reviewer unavailable"} · {formatDate(quotation.submittedAt)}</p>
            </div>}
            {quotation.approvedAt && <div className="text-sm text-gray-500">
              <p className="font-medium text-text">Approval</p>
              <p>{quotation.approvedBy?.name || "Reviewer unavailable"} · {formatDate(quotation.approvedAt)}</p>
            </div>}
            {quotation.rejectionReason && <div className="text-sm text-gray-500">
              <p className="font-medium text-text">{quotation.status === "REJECTED" ? "Rejection" : "Most recent rejection"}</p>
              <p className="mt-1 whitespace-pre-line text-text">{quotation.rejectionReason}</p>
              <p className="mt-1">{quotation.rejectedBy?.name || "Reviewer unavailable"}{quotation.rejectedAt ? ` · ${formatDate(quotation.rejectedAt)}` : ""}</p>
            </div>}
          </section>}

        {/* Signature */}
        <div className="mt-16 flex justify-end">
          <div className="w-48 text-center">
            <div className="h-14 border-b border-border-color" />

            <p className="mt-2 text-xs font-medium text-gray-500">
              Authorized Signature
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationPreview;
