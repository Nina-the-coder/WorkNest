import OrderCard from "./OrderCard";

const OrderList = ({ orders, onSelect, activeOrder }) => (
  <div className="max-h-[700px] w-full shrink-0 overflow-y-auto lg:w-[360px]">
    {orders.map(order => <OrderCard key={order._id || order.orderId} order={order}
      selected={activeOrder?.orderId === order.orderId} onOrderClick={() => onSelect(order)} />)}
  </div>
);
export default OrderList;
