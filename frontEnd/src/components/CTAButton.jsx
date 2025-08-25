import React from "react";
import Icon from "./Icons";

const CTAButton = ({ onClick, icon, children }) => {
  return (
    <button
      type="button"
      className="w-[168px] h-[52px] flex justify-evenly items-center leading-4 rounded-xl text-white bg-cta hover:cursor-pointer hover:bg-cta/90"
      onClick={onClick}
    >
      <Icon name={icon} className="" />
      <span className="mr-4">{children}</span>
    </button>
  );
};

export default CTAButton;
