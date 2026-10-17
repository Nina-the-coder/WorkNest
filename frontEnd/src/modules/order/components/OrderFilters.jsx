import SearchBar from "../../../shared/components/SearchBar";
import FilterDropdown from "../../../shared/components/FilterDropdown";
import { ORDER_STATUS_LABELS } from "../order.util";

const OrderFilters = ({ searchQuery, setSearchQuery, statusFilter, setStatusFilter, statuses }) => (
  <div className="flex flex-wrap gap-4">
    <SearchBar placeholder="Search order, customer or quotation" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
    <FilterDropdown value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
      <option value="">All statuses</option>
      {statuses.map(status => <option key={status} value={status}>{ORDER_STATUS_LABELS[status] || status}</option>)}
    </FilterDropdown>
  </div>
);
export default OrderFilters;
