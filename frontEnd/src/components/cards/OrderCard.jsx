import React from "react";
import VariantButton from "../buttons/VariantButton";

const OrderCard = ({ order, deleteOrder, onOrderClick }) => {
  return (
    <div 
        onClick={onOrderClick}
        className="w-[500px] h-fit pb-2 bg-card-bg text-secondary-text rounded-2xl bg-gradient-to-r from-bg/80 to-card-bg/10 hover:shadow-xl translate-all duration-300 my-2">
      {/* top right */}
      <div className="flex justify-end">
        <VariantButton onClick={deleteOrder} variant="red" text="" icon="trash-2" size="tiny" />
      </div>

      {/* middle */}
      <div className=" flex ml-8 justify-between mr-[100px]">
        <div className="text-text text-[18px] font-bold">
          {order.orderId} - {order.quotationId?.quotationId}
        </div>
        <div className={`h-[16px] w-[80px]  text-black ${
          order.status === "confirm"
            ? "bg-green"
            : order.status === "dispatched" ? "bg-orange/80"
            : order.status === "delivered" ? "bg-cta/80"
            : "bg-gray-400"
        } rounded-2xl text-[14px] flex justify-center items-center`}>
          {order.status}
        </div>
      </div>

      {/* bottom */}
      <div className="ml-8 mt-1">
        <div>
          Added By: {order?.addedBy?.name} ({order?.addedBy?.empId})
        </div>
        <div>
          Dispatch Date: {/* if date is not found provide date not set */}
          {order?.dispatchDate
            ? new Date(order?.dispatchDate)
                .toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
                .toUpperCase()
            : "Date not set"}
        </div>
      </div>

      {/* total */}
      <div className="flex justify-end mr-8 mt-2 mb-2 font-bold text-text text-[18px]">
        <div>Total : ₹ {order?.totalSnapshot}</div>
      </div>
    </div>
  );
};

export default OrderCard;

// <div
//   className="w-200 min-h-30 bg-slate-800 text-slate-300 p-4 text-lg flex"
//   key={order.orderId}
// >
//   {/* left */}
//   <div className="flex flex-col mr-40">
//     <div>
//       {order.orderId} - {order.quotationId?.customerId?.customerId}
//     </div>
//     <div>Dispatch Date : {order.dispatchDate}</div>
//   </div>

//   {/* right */}
//   <div className="">dispatched</div>
// </div>;
