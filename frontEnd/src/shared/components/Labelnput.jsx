import React from "react";

const LabelInput = ({
  labelName,
  name,
  inputType = "text",
  value,
  onChange,
  inputPlaceholder = "",
}) => {
  return (
    <div className="w-full flex flex-col">
      <label className="ml-2 mb-0.5 text-secondary-text">
        {labelName}
      </label>

      <input
        type={inputType}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={inputPlaceholder}
        className="w-full h-[30px] bg-bg rounded-xl px-2"
      />
    </div>
  );
};

export default LabelInput;