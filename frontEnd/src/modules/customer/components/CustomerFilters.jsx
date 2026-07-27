// modules/customer/components/CustomerFilters.jsx
import SearchBar from "../../../shared/components/SearchBar";
import FilterDropdown from "../../../shared/components/FilterDropdown";
import CTAButton from "../../../shared/components/buttons/CTAButton";

const CustomerFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  companyTypeFilter,
  setCompanyTypeFilter,
  openModal,
}) => {
  return (
          <div className="flex gap-8 my-10">
      <div className="flex gap-4">
        <SearchBar
          placeholder="Search customer"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <FilterDropdown
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FilterDropdown>

        <FilterDropdown
          value={companyTypeFilter}
          onChange={(e) => setCompanyTypeFilter(e.target.value)}
        >
          <option value="">All Company</option>
          <option value="dealer">Dealer</option>
          <option value="doctor">Doctor</option>
        </FilterDropdown>
      </div>

      <CTAButton onClick={openModal} icon="plus">
        Add Customer
      </CTAButton>
    </div>
  );
};

export default CustomerFilters;