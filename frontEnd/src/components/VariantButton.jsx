import React from "react";
import Icon from "./Icons";

const VariantButton = ({ onClick, variant, size, text, icon }) => {
  const baseClasses =
    "flex items-center rounded-xl hover:cursor-pointer pl-0.5";

  const sizeClasses = {
    small: "h-[28px] w-[90px]",
    medium: "h-[28px] w-[100px]",
    large: "",
  };

  const variantClasses = {
    ghostCta: "border-2 border-cta text-text/90 hover:bg-cta hover:text-white",
    ghostRed: "border-2 border-red/60 text-text/90 hover:bg-red hover:text-white",
    cta: "border-2 border-cta bg-cta text-white hover:bg-cta/90 hover:text-white",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;

  return (
    <button type="button" className={classes} onClick={onClick}>
      <Icon name={icon} className="h-[20px] w-[20px] mx-0.5" />
      <span className="mx-2">{text}</span>
    </button>
  );
};

export default VariantButton;
