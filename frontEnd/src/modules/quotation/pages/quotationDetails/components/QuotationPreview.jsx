import QuotationCompanyHeader from "./QuotationCompanyHeader";
import QuotationCustomerSection from "./QuotationCustomerSection";
import QuotationItemsTable from "./QuotationItemsTable";
import QuotationSummary from "./QuotationSummary";
import QuotationNotes from "./QuotationNotes";

const QuotationPreview = ({ quotation, totals }) => {
  return (
    <div className="mx-auto w-full max-w-[1000px] overflow-hidden rounded-2xl border border-border-color bg-card-bg shadow-sm">
      <QuotationCompanyHeader quotation={quotation} />

      <div className="px-6 py-7 sm:px-10 sm:py-9">
        <QuotationCustomerSection quotation={quotation} />

        <QuotationItemsTable items={quotation.items || []} />

        <QuotationSummary totals={totals} />

        <QuotationNotes notes={quotation.notes} />

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
