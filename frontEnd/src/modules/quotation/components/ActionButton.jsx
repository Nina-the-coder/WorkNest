/* -------------------------------------------------------------------------- */
/* Action Button                                                              */
/* -------------------------------------------------------------------------- */

const ActionButton = ({
  icon: Icon,
  label,
  onClick,
  variant = "default",
}) => {
  const variants = {
    default:
      "border-border-color text-gray-500 hover:bg-bg hover:text-text",
    success:
      "border-green-500/20 text-green-600 hover:bg-green-500/10",
    danger:
      "border-red/20 text-red hover:bg-red/10",
    primary:
      "border-cta/20 text-cta hover:bg-cta/10",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition ${variants[variant]}`}
    >
      <Icon size={13} />
      <span>{label}</span>
    </button>
  );
};

export default ActionButton;