import React from "react";
import VariantButton from "../buttons/VariantButton";
import FilterDropdown from "../FilterDropdown";

const OrderPreviewCard = ({
  order,
  downloadOrder,
  editOrder,
  delteOrder,
  updateStatus,
}) => {
  return (
    <div className="w-[450px] h-fit mr-16">
      {/* buttons */}
      <div className="flex justify-end mt-4 gap-4 mr-4">
        <VariantButton
          variant="ghostCta"
          text=""
          icon="arrow-down-to-line"
          size="tiny"
          onClick={downloadOrder}
        />
        <VariantButton
          onClick={editOrder}
          variant="ghostCta"
          text=""
          icon="pencil"
          size="tiny"
        />
        <VariantButton
          onClick={delteOrder}
          variant="red"
          text=""
          icon="trash-2"
          size="tiny"
        />
      </div>

      {/* main card */}
      <div className=" w-[450px] h-fit p-8 bg-card-bg text-secondary-text rounded-2xl my-2 shadow-xl">
        {/* heading details */}
        <div className="flex justify-between">
          <div className="text-text text-[18px] font-bold">
            {order.orderId} - {order.quotationId?.quotationId}
          </div>
          <select
            onChange={updateStatus}
            className={`h-[24px] w-[120px]
              ${order.status === "confirm"
                ? "bg-green"
                : order.status === "dispatched" ? "bg-orange/80"
                : order.status === "delivered" ? "bg-cta/80"
                : "bg-gray-400"
              }
              rounded-2xl text-[14px] flex justify-center items-center text-black py-0.5 px-2 hover:cursor-pointer`}
            value={order.status}
          >
            <option value="confirm">Confirm</option>
            <option value="dispatched">Dispatched</option>
            <option value="delivered">Delivered</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="mt-1">
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

        {/* products */}
        <div className="mt-8">
          <div className="font-semibold text-text text-[18px] mb-2">
            {" "}
            Products:
          </div>
          <div className="border-b-2 mb-2"></div>
          {order?.productsSnapshot?.map((prod, index) => (
            <div key={index} className="flex justify-between">
              <div>
                {prod?.name} (x{prod.quantity})
              </div>
              <div>₹ {prod?.price * prod.quantity}</div>
            </div>
          ))}
        </div>

        {/* total */}
        <div>
          <div className="border-b-2 my-2"></div>
          <div className="flex justify-end mt-2 mb-2 font-bold text-text text-[16px]">
            <div>Total : ₹ {order?.totalSnapshot}</div>
          </div>
        </div>

        {/* dispatch details */}
        <div className="mt-8">
          <div className="font-semibold text-text text-[18px] mb-2">
            {" "}
            Dispatch Details:
          </div>
          <div className="border-b-2 mb-2"></div>
          <div>Name: {order?.customerSnapshot?.name || "Not Set"}</div>
          <div>
            Company: {order?.customerSnapshot?.companyType || "Not Set"}
          </div>
          <div>
            Contact: {order?.customerSnapshot?.contact || "Not Set"}
          </div>
          <div>
            Address: {order?.customerSnapshot?.address || "Not Set"}
          </div>
          <div>GST: {order?.customerSnapshot?.gst || "Not Set"}</div>
          <div>Email: {order?.customerSnapshot?.email || "Not Set"}</div>
        </div>
      </div>
    </div>
  );
};

export default OrderPreviewCard;
