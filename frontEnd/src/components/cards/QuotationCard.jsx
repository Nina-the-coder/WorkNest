import React from "react";
import VariantButton from "../buttons/VariantButton";

const QuotationCard = () => {
  return (
    <div className="flex">
      {/* left */}
      <div>
        <div>QUOT105 - CUST106 (CUSTOMER NAME)</div>
        <div>Added By : EMP104 (employee name)</div>
        <div className="flex items-center gap-4">
          <div>Doctor status : </div>
          <div
            className={`h-[16px] w-[80px] bg-green rounded-2xl text-[14px] flex justify-center items-center text-black`}
          >
            Approved
          </div>
        </div>
      </div>
      <div>Total: ₹50,000</div>

      {/* bottom */}
      <div className="flex">
        <VariantButton
          variant={"ghostGreen"}
          text={"Approve"}
          icon={"check"}
          size="medium"
        />
        <VariantButton
          variant={"ghostRed"}
          text={"Reject"}
          icon={"x"}
          size="medium"
        />
      </div>

      {/* right */}
      <div></div>
    </div>
  );
};

export default QuotationCard;

// <div
//   className="min-h-30 w-250 bg-slate-800 mt-4 flex justify-between text-slate-300 p-4 text-lg"
//   key={quotation.quotationId}
// >
//   {/* 1st */}
//   <div className="flex flex-col justify-between w-1/2">
//     <div className="text-white flex justify-between">
//       <div>
//         {quotation.quotationId} - {quotation.customerId?.customerId}{" "}
//         {`(${quotation.customerId?.name})`}
//       </div>
//       <div
//         className={`ml-30 text-black py-0.5 px-4 rounded-xl ${
//           quotation.status === "pending"
//             ? "bg-amber-500"
//             : quotation.status === "approved"
//             ? "bg-emerald-500"
//             : "bg-rose-500"
//         }`}
//       >
//         {quotation.status}
//       </div>
//     </div>
//     <div>Added By: {quotation.addedBy?.name}</div>
//     <div>Doctor's status: {quotation.isApprovedByDoctor}</div>
//   </div>

//   {/* 2nd */}
//   <div className="flex flex-col-reverse">
//     <div className="text-white">Total - {quotation.total}</div>
//   </div>

//   {/* 3rd */}
//   <div className="flex flex-col justify-between">
//     <button
//       className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
//       onClick={(e) => handleApproveQuotation(e, quotation)}
//     >
//       Approve
//     </button>
//     <button
//       className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
//       onClick={(e) => handleRejectQuotation(e, quotation)}
//     >
//       Reject
//     </button>
//   </div>

//   {/* 4th */}
//   <div className="flex flex-col justify-between">
//     <button
//       className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
//       onClick={(e) => handleEditQuotation(e, quotation)}
//     >
//       Edit
//     </button>
//     <button
//       className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
//       onClick={(e) =>
//         handleDeleteQuotation(e, quotation.quotationId)
//       }
//     >
//       Delete
//     </button>
//   </div>

//   {/* 5th */}
//   <div className="flex justify-center">
//     <button
//       className="h-full w-20 bg-slate-700 cursor-pointer hover:bg-slate-600"
//       onClick={(e) => handleMakeOrder(e, quotation)}
//     >
//       Make Order
//     </button>
//   </div>
// </div>
