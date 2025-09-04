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

  useEffect(() => {
    if (selected) {
      console.log(selected);
      setInputValue(`${selected.name} (${selected.empId})`);
    } else {
      setInputValue("");
    }
  }, [selected]);

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
    <div className="relative w-full">
      <label
        htmlFor="assignedTo"
        className="w-full text-[16px] ml-4 text-text/90"
      >
        Employee
      </label>
      <input
        type="text"
        id="assignedTo"
        name="assignedTo"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setShowDropdown(true)}
        className="w-full h-[28px] p-0.5 px-2 rounded-xl mb-4 bg-white"
        autoComplete="off"
        placeholder="Type name or empId"
      />
      {showDropdown && filteredEmployees.length > 0 && (
        <ul className="absolute z-10 bg-white top-[52px] border w-full max-h-40 overflow-y-auto shadow">
          {filteredEmployees.map((emp, index) => (
            <li
              key={emp.empId || index}
              onClick={() => handleSelect(emp)}
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
