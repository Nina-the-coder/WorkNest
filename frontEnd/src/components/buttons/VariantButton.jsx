import React from "react";
import Icon from "../Icons";

const VariantButton = ({
  onClick,
  variant,
  size,
  text,
  icon = "",
  className,
}) => {
  const baseClasses =
    "flex items-center justify-center hover:cursor-pointer";  // gap-1 was removed 

  const sizeClasses = {
    tiny: "h-[28px] w-[28px]",
    small: "h-[28px] w-[90px]",
    smsquare: "h-[40px] w-[40px]",
    medium: "h-[28px] w-[100px]",
    large: "h-[35px] lg:h-[40px] w-[150px] text-[22px]",
    "extra-large":
      "w-[200px] lg:w-[400px] h-[60px] lg:h-[90px] text-[20px] lg:text-[32px]",
    free: "h-full w-full", // width will be according to content
  };

  const variantClasses = {
    ghostCta:
      "border-2 border-cta/60 rounded-xl text-text/90 hover:bg-cta hover:text-white",
    ghostRed:
      "border-2 border-red/60 text-text/90 rounded-xl hover:bg-red hover:text-white",
    ghostGreen:
      "border-2 border-green/60 text-text/90 rounded-xl hover:bg-green hover:text-white",
    cta: "border-2 border-cta bg-cta text-white rounded-xl hover:bg-cta/90 hover:text-white",
    red: "border-2 border-red bg-red text-white rounded-xl hover:bg-red/80",
    cta: "border-2 border-cta bg-cta text-white rounded-xl hover:bg-cta/80",
    green:
      "border-2 border-green bg-green text-text hover:bg-green/80 rounded-2xl",
    outline:
      "border-2 border-black/10 bg-white text-black rounded-xl hover:bg-gray-100",
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${
    sizeClasses[size] || ""
  } ${className || ""}`;

  return (
    <button type="button" className={classes} onClick={onClick}>
      <span className="">{text}</span>
      {icon && (
        <Icon
          name={icon}
          className={`${
            size != "extra-large" ? "h-[20px] w-[20px]" : "h-[50px] w-[50px]"
          } `}
        />
      )}
    </button>
  );
};

export default VariantButton;
