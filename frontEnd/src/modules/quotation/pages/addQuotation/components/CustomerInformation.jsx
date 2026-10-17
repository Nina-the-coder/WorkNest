import { FiMapPin, FiPhone, FiUser } from "react-icons/fi";

// Quotation APIs use the customer reference; they do not persist inline edits.
const CustomerInformation = ({ customer }) => {
  if (!customer) return null;
  const fields = [
    { label: "Contact", value: customer.contact, Icon: FiPhone },
    { label: "GST", value: customer.gstNumber || customer.gst },
    { label: "Address", value: customer.address, Icon: FiMapPin },
  ];
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border-color bg-bg">
      <div className="flex items-center gap-3 border-b border-border-color px-4 py-3">
        <FiUser size={16} className="text-cta" />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Customer Information</p>
          <p className="mt-0.5 text-sm font-semibold text-text">{customer.name || "Customer"}</p>
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {fields.map(({ label, value, Icon }) => value ? (
          <div key={label} className={label === "Address" ? "sm:col-span-2" : ""}>
            <p className="flex items-center gap-2 text-xs text-gray-500">{Icon && <Icon size={13} />}{label}</p>
            <p className="mt-1.5 whitespace-pre-line text-sm font-medium text-text">{value}</p>
          </div>
        ) : null)}
      </div>
    </div>
  );
};

export default CustomerInformation;
