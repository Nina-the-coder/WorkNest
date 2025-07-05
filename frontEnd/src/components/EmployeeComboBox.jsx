import React, { useEffect, useState } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const EmployeeComboBox = ({ selected, onSelect }) => {
  const [employees, setEmployees] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/admin/employees`);
        setEmployees(res.data);
        setFilteredEmployees(res.data);
      } catch (err) {
        console.error("Error fetching employees from the db: ", err);
      }
    };

    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    const filtered = employees.filter((emp) => {
      const nameMatch = emp.name.toLowerCase().includes(value.toLowerCase());
      const idMatch = emp.empId?.toLowerCase().includes(value.toLowerCase());
      return nameMatch || idMatch;
    });

    setFilteredEmployees(filtered);
    setShowDropdown(true);
  };

  const handleSelect = (emp) => {
    setInputValue(`${emp.name} (${emp.empId})`);
    setShowDropdown(false);
    if (onSelect) onSelect(emp);
  };

  return (
    <div className="relative w-full mb-4">
      <label htmlFor="assignedTo" className="w-full text-lg text-slate-200">
        Employee
      </label>
      <input
        type="text"
        id="assignedTo"
        name="assignedTo"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setShowDropdown(true)}
        className="border w-full p-0.5 rounded bg-slate-200"
        placeholder="Type name or empId"
      />
      {showDropdown && filteredEmployees.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto shadow">
          {filteredEmployees.map((emp, index) => (
            <li
              key={emp.empId || index}
              onClick={() => handleSelect({ name: emp.name, empId: emp.empId })}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {emp.name} ({emp.empId})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmployeeComboBox;
