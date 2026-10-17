import { useCallback, useEffect, useState } from "react";
import api from "../../../api/axios";

const employeeLabel = (employee) => employee.empId
  ? `${employee.name} (${employee.empId})`
  : employee.name;

const EmployeeComboBox = ({ labelName = "Select Employee", selected, onSelect, employeesOnly = false }) => {
  const [employees, setEmployees] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get("/api/employees");
      setEmployees(response.data.filter((employee) =>
        employee.status === "active" && !employee.deleted &&
        (!employeesOnly || employee.role === "employee")));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [employeesOnly]);

  useEffect(() => { void fetchEmployees(); }, [fetchEmployees]);

  useEffect(() => {
    const employee = typeof selected === "object" && selected
      ? selected
      : employees.find((entry) => entry._id === selected);
    setInputValue(employee ? employeeLabel(employee) : "");
  }, [selected, employees]);

  const filteredEmployees = employees.filter((employee) =>
    `${employee.name} ${employee.empId || ""}`.toLowerCase().includes(inputValue.toLowerCase()) ||
    employeeLabel(employee) === inputValue,
  );
  // Opening an existing selection offers every eligible employee for reassignment.
  const options = selected && inputValue === employeeLabel(
    typeof selected === "object" ? selected : employees.find((entry) => entry._id === selected) || { name: "" },
  ) ? employees : filteredEmployees;

  const handleSelect = (employee) => {
    setInputValue(employeeLabel(employee));
    setShowDropdown(false);
    onSelect?.(employee);
  };

  return (
    <div className="relative w-full">
      <label htmlFor="assignedTo" className="ml-2 mb-0.5 text-secondary-text">{labelName}</label>
      <input type="text" id="assignedTo" name="assignedTo" value={inputValue}
        onChange={(event) => { setInputValue(event.target.value); setShowDropdown(true); }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={(event) => { if (event.key === "Escape") setShowDropdown(false); }}
        className="w-full h-7 p-0.5 px-2 rounded-xl bg-white text-black"
        autoComplete="off" placeholder={loading ? "Loading employees…" : "Type name or empId"} />
      {error && <p role="alert" className="mt-1 text-sm text-red">Unable to load employees. <button type="button" onClick={fetchEmployees} className="underline">Retry</button></p>}
      {showDropdown && !loading && !error && (
        <ul aria-label="Employees" className="absolute z-10 bg-white text-black top-[52px] border w-full max-h-40 overflow-y-auto shadow">
          {options.map((employee) => (
            <li key={employee._id}>
              <button type="button" onClick={() => handleSelect(employee)} className="w-full p-2 text-left hover:bg-gray-100">
                {employeeLabel(employee)}
              </button>
            </li>
          ))}
          {options.length === 0 && <li className="p-2">No matching active employees.</li>}
        </ul>
      )}
    </div>
  );
};

export default EmployeeComboBox;
