// modules/order/components/OrderList.jsx
import OrderCard from "./OrderCard";

const OrderList = ({
  orders,
  onSelect,
  removeOrder,
}) => {
  return (
    <div className="h-[500px] flex flex-col overflow-auto px-4">
      {orders.map((order) => (
        <OrderCard
          key={order._id}
          order={order}
          onOrderClick={() => onSelect(order)}
          deleteOrder={() => removeOrder(order)}
        />
      ))}
    </div>
  );
};

export default OrderList;