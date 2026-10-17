import OrderPreviewCard from "./OrderPreviewCard";

const OrderPreviewPanel = ({ activeOrder, ...actions }) => activeOrder
  ? <OrderPreviewCard order={activeOrder} {...actions} />
  : <p className="flex min-h-48 flex-1 items-center justify-center text-secondary-text">Select an order to preview</p>;
export default OrderPreviewPanel;
