import { FiMapPin, FiPhone, FiUser, FiUsers } from "react-icons/fi";

const QuotationCustomerSection = ({ quotation }) => {

  console.log("quotation", quotation);
  return (
    <div className="grid gap-8 border-b border-border-color pb-8 sm:grid-cols-2">
      {/* Customer */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Quotation To
        </p>

        <div className="mt-3 flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
            <FiUser size={17} />
          </div>

          <div className="min-w-0">
            <p className="text-base font-semibold text-text">
              {quotation.customerId?.name || "—"}
            </p>

            <div className="mt-1 space-y-1">
              {quotation.customerId?.contact && (
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <FiPhone size={13} />
                  {quotation.customerId.contact}
                </p>
              )}

              {quotation.customerId?.address && (
                <p className="flex items-start gap-2 text-sm text-gray-500">
                  <FiMapPin size={13} className="mt-0.5 shrink-0" />

                  <span className="whitespace-pre-line">
                    {quotation.customerId.address}
                  </span>
                </p>
              )}

              {quotation.customerId?.gst && (
                <p className="text-sm text-gray-500">
                  GSTIN:{" "}
                  <span className="text-text">
                    {quotation.customerId.gst}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee */}
      <div className="sm:text-right">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Created By
        </p>

        <div className="mt-3 flex gap-3 sm:justify-end">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
            <FiUsers size={17} />
          </div>

          <div>
            <p className="text-base font-semibold text-text">
              {quotation.employeeId?.name || "—"}
            </p>

            {quotation.employeeId?.empId && (
              <p className="mt-1 text-sm text-gray-500">
                {quotation.employeeId.empId}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationCustomerSection;
