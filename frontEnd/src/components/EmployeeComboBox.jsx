import React, { useState } from "react";

const EmployeeComboBox = () => {
  const employees = ["John Doe", "Jane Smith", "Ravi Kumar", "Aisha Khan"];
  
  const [inputValue, setInputValue] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState(employees);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setFilteredEmployees(
      employees.filter((emp) =>
        emp.toLowerCase().includes(value.toLowerCase())
      )
    );
    setShowDropdown(true);
  };

  const handleSelect = (value) => {
    setInputValue(value);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full mb-4">
      <label htmlFor="employee" className="w-full text-lg">
        Employee
      </label>
      <input
        type="text"
        id="employee"
        name="employee"
        value={inputValue}
        onChange={handleChange}
        onFocus={() => setShowDropdown(true)}
        className="border w-full p-0.5 rounded bg-white"
        placeholder="Type or select an employee"
      />
      {showDropdown && filteredEmployees.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-y-auto shadow">
          {filteredEmployees.map((emp, index) => (
            <li
              key={index}
              onClick={() => handleSelect(emp)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {emp}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmployeeComboBox;
