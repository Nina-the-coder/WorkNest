import React from "react";
import ThemeToggle from "./buttons/ThemeToggle";

const Header = ({ title }) => {
  return (
    <div className="w-full h-[48px] flex items-center text-text">
      <div className="flex w-full justify-between">
        <div className="text-[24px] font-bold ml-6">{title}</div>
        <div className="text-[24px] font-bold mr-4">Admin</div>
      </div>
      <ThemeToggle />
    </div>
  );
};

export default Header;
