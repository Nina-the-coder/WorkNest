// modules/order/components/OrderFilters.jsx
import SearchBar from "../../../shared/components/SearchBar";
import FilterDropdown from "../../../shared/components/FilterDropdown";

const OrderFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <div className="flex gap-4">
      <SearchBar
        placeholder="Search order"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <FilterDropdown
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All</option>
        <option value="confirm">Confirm</option>
        <option value="dispatched">Dispatched</option>
        <option value="delivered">Delivered</option>
        <option value="closed">Closed</option>
      </FilterDropdown>
    </div>
  );
};

export default OrderFilters;