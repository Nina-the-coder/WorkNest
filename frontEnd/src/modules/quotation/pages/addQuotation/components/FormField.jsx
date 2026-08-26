const FormField = ({
  label,
  icon: Icon,
  required,
  children,
  className = "",
}) => {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-center gap-2 text-sm font-medium text-text">
        {Icon && <Icon className="text-gray-500" size={15} />}
        {label}
        {required && <span className="text-red">*</span>}
      </span>

      {children}
    </label>
  );
};

export default FormField;