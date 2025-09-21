import React from "react";
import Icon from "../Icons";

const VariantButton = ({ onClick, variant, size, text, icon, className }) => {
  const baseClasses =
    "flex items-center rounded-xl hover:cursor-pointer pl-0.5 gap-1";

  const sizeClasses = {
    tiny: "h-[28px] w-[28px]",
    small: "h-[28px] w-[90px]",
    medium: "h-[28px] w-[100px]",
    large: "h-[40px] w-[100px]",
    "extra-large": "h-[40px] w-[100px]"
  };

  const variantClasses = {
    ghostCta: "border-2 border-cta/60 text-text/90 hover:bg-cta hover:text-white",
    ghostRed: "border-2 border-red/60 text-text/90 hover:bg-red hover:text-white",
    ghostGreen: "border-2 border-green/60 text-text/90 hover:bg-green hover:text-white",
    cta: "border-2 border-cta bg-cta text-white hover:bg-cta/90 hover:text-white",
    red: "border-2 border-red bg-red text-white hover:bg-red/80",
    blue: "border-2 border-cta bg-cta text-white hover:bg-cta/80",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${
    sizeClasses[size] || ""
  } ${className || ""}`;

  return (
    <button type="button" className={classes} onClick={onClick}>
      <Icon name={icon} className="h-[20px] w-[20px] mx-0.5" />
      <span className="">{text}</span>
    </button>
  );
};

export default VariantButton;
