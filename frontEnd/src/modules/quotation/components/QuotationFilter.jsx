// modules/quotation/components/QuotationFilters.jsx
import SearchBar from "../../../shared/components/SearchBar";
import FilterDropdown from "../../../shared/components/FilterDropdown";
import CTAButton from "../../../shared/components/buttons/CTAButton";

const QuotationFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  openModal,
}) => {
  return (
    <div className="flex gap-4 justify-between w-full">
      <div className="flex gap-4">
        <SearchBar
          placeholder="Search quotation"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
        />

        <FilterDropdown
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="pending">Pending</option>
        </FilterDropdown>
      </div>

      <CTAButton onClick={openModal} icon="plus">
        Add Quotation
      </CTAButton>
    </div>
  );
};

export default QuotationFilters;