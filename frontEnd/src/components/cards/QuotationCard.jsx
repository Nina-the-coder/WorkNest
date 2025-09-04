import React, { useState } from "react";
import VariantButton from "../buttons/VariantButton";

const QuotationCard = ({
  quotation,
  approveQuotation,
  rejectQuotation,
  deleteQuotation,
  editQuotation,
  makeOrder,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="my-2 w-[850px] h-fit bg-card-bg text-secondary-text rounded-2xl bg-gradient-to-r from-bg/80 to-card-bg/10 hover:shadow-xl transition-all duration-300"
      key={quotation.quotationId}
    >
      {/* top */}
      <div className="flex ml-8 justify-between mb-2">
        {/* left */}
        <div className="mt-8 flex flex-col gap-1">
          <div className="text-text font-bold text-[18px]">
            {quotation.quotationId} - {quotation.customerId?.customerId}{" "}
            {`(${quotation.customerId?.name})`}
          </div>
          <div>Added By : {quotation.addedBy?.name}</div>
          <div className="flex items-center gap-4">
            <div>Doctor status : </div>
            <div
              className={`h-[16px] w-[80px] ${
                quotation.isApprovedByDoctor === "approved"
                  ? "bg-green"
                  : quotation.isApprovedByDoctor === "pending"
                  ? "bg-orange"
                  : "bg-red"
              } rounded-2xl text-[14px] flex justify-center items-center text-black`}
            >
              {quotation.isApprovedByDoctor}
            </div>
          </div>
        </div>

        {/* right */}
        <div className="flex">
          <VariantButton
            onClick={editQuotation}
            variant="ghostCta"
            text=""
            icon="pencil"
            size="tiny"
          />
          <VariantButton
            onClick={deleteQuotation}
            variant="red"
            text=""
            icon="trash-2"
            size="tiny"
          />
        </div>
      </div>

      {/* middle with smooth transition */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[400px] overflow-auto opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="m-8">
          <div className="text-text text-[18px] font-semibold">Products</div>
          <div className="h-0.25 my-2 w-[400px] bg-text"></div>
          <ul>
            {quotation.products.map((product) => (
              <li key={product.productId}>
                {`${product.name} (${product.quantity}) - ${product.price}`}
              </li>
            ))}
          </ul>
          <div className="h-0.25 my-2 w-[400px] bg-text"></div>
        </div>
      </div>

      {/* bottom */}
      <div className="flex justify-between items-center ml-8 mt-6">
        <div className="text-text font-semi-bold text-[18px] mb-6">
          Total: ₹ {quotation.total}
        </div>
        <div className="flex gap-2 mr-8 mb-6">
          <VariantButton
            onClick={approveQuotation}
            variant={"ghostGreen"}
            text={"Approve"}
            icon={"check"}
            size="medium"
          />
          <VariantButton
            onClick={rejectQuotation}
            variant={"ghostRed"}
            text={"Reject"}
            icon={"x"}
            size="medium"
          />
        </div>
        <div>
          {isExpanded && (
            <VariantButton
              onClick={makeOrder}
              variant="cta"
              size="large"
              text="Make Order"
              icon="arrow-right"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default QuotationCard;
