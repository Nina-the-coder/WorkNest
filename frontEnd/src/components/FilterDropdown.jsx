import React from "react";

const FilterDropdown = ({ value, onChange, children }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className="h-[40px] w-[120px] border rounded-xl text-[14px] bg-white hover:cursor-pointer px-2"
    >
      {children}
    </select>
  );
};

export default FilterDropdown;
