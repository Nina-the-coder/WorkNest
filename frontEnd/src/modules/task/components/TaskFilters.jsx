// modules/task/components/TaskFilters.jsx
import SearchBar from "../../../shared/components/SearchBar";
import FilterDropdown from "../../../shared/components/FilterDropdown";

const TaskFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
}) => {
  return (
    <div className="flex gap-4">
      <SearchBar
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <FilterDropdown
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In-Progress</option>
        <option value="done">Done</option>
      </FilterDropdown>

      <FilterDropdown
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
      >
        <option value="">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </FilterDropdown>
    </div>
  );
};

export default TaskFilters;