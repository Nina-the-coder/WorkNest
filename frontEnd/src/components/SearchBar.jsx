import React from "react";

const SearchBar = ({ placeholder, value, onChange }) => {
  return (
    <input
      type="text"
      className="h-[40px] w-full lg:w-[448px] bg-white rounded-xl px-4 border"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
};

export default SearchBar;
