// modules/employee/components/EmployeeFilters.jsx
import SearchBar from "../../../shared/components/SearchBar";
import FilterDropdown from "../../../shared/components/FilterDropdown";

const EmployeeFilters = ({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
}) => {
  return (
    <div className="flex gap-4">
      <SearchBar
        placeholder="Search employee..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <FilterDropdown
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
      >
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="employee">Employee</option>
      </FilterDropdown>

      <FilterDropdown
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </FilterDropdown>
    </div>
  );
};

export default EmployeeFilters;