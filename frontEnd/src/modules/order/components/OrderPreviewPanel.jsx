// modules/order/components/OrderPreviewPanel.jsx
import OrderPreviewCard from "./OrderPreviewCard";

const OrderPreviewPanel = ({
  activeOrder,
  updateStatus,
  removeOrder,
  downloadOrder,
}) => {
  if (!activeOrder) {
    return (
      <div className="flex items-center justify-center h-120 w-[450px] text-text text-[18px] font-bold">
        Select an order to preview
      </div>
    );
  }

  return (
    <OrderPreviewCard
      order={activeOrder}
      downloadOrder={() => downloadOrder(activeOrder, "pdf")}
      delteOrder={() => removeOrder(activeOrder)}
      updateStatus={(e) =>
        updateStatus(activeOrder, e.target.value)
      }
    />
  );
};

export default OrderPreviewPanel;