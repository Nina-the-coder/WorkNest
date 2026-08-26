import { useEffect, useState } from "react";
import {
  FiEdit2,
  FiMapPin,
  FiPhone,
  FiSave,
  FiUser,
  FiX,
} from "react-icons/fi";

const inputClass =
  "w-full rounded-lg border border-border-color bg-card-bg px-3 py-2.5 text-sm text-text outline-none transition placeholder:text-gray-400 focus:border-cta focus:ring-2 focus:ring-cta/10";

const CustomerInformation = ({ customer, onChange }) => {
  const [editing, setEditing] = useState(false);

  const [customerDetails, setCustomerDetails] = useState({
    contact: "",
    address: "",
    gst: "",
  });

  /* ------------------------------------------------------------------------ */
  /* Load selected customer details                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!customer) {
      setCustomerDetails({
        contact: "",
        address: "",
        gst: "",
      });

      setEditing(false);
      return;
    }

    setCustomerDetails({
      contact: customer.contact || "",
      address: customer.address || "",
      gst: customer.gstNumber || customer.gst || "",
    });

    setEditing(false);
  }, [customer]);

  /* ------------------------------------------------------------------------ */
  /* Change customer detail                                                   */
  /* ------------------------------------------------------------------------ */

  const updateDetail = (field, value) => {
    setCustomerDetails((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* ------------------------------------------------------------------------ */
  /* Save customer details                                                    */
  /* ------------------------------------------------------------------------ */

  const handleSave = () => {
    onChange(customerDetails);
    setEditing(false);
  };

  /* ------------------------------------------------------------------------ */
  /* Cancel editing                                                           */
  /* ------------------------------------------------------------------------ */

  const handleCancel = () => {
    if (customer) {
      setCustomerDetails({
        contact: customer.contact || "",
        address: customer.address || "",
        gst: customer.gstNumber || customer.gst || "",
      });
    }

    setEditing(false);
  };

  if (!customer) {
    return null;
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border-color bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border-color px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
            <FiUser size={16} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Customer Information
            </p>

            <p className="mt-0.5 truncate text-sm font-semibold text-text">
              {customer.name || "—"}
            </p>
          </div>
        </div>

        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border-color bg-card-bg px-2.5 py-2 text-xs font-medium text-gray-500 transition hover:border-cta/30 hover:text-cta"
          >
            <FiEdit2 size={13} />
            Edit
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-color bg-card-bg px-2.5 py-2 text-xs font-medium text-gray-500 transition hover:text-text"
            >
              <FiX size={13} />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cta px-2.5 py-2 text-xs font-medium text-white transition hover:opacity-90"
            >
              <FiSave size={13} />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4">
        {editing ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Contact */}
            <label>
              <span className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <FiPhone size={13} />
                Contact
              </span>

              <input
                type="text"
                className={`${inputClass} mt-2`}
                placeholder="Enter contact number"
                value={customerDetails.contact}
                onChange={(e) =>
                  updateDetail("contact", e.target.value)
                }
              />
            </label>

            {/* GST */}
            <label>
              <span className="text-xs font-medium text-gray-500">
                GST
              </span>

              <input
                type="text"
                className={`${inputClass} mt-2`}
                placeholder="Enter GST number"
                value={customerDetails.gst}
                onChange={(e) =>
                  updateDetail("gst", e.target.value)
                }
              />
            </label>

            {/* Address */}
            <label className="sm:col-span-2">
              <span className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <FiMapPin size={13} />
                Address
              </span>

              <textarea
                className={`${inputClass} mt-2 min-h-[90px] resize-y`}
                placeholder="Enter customer address"
                value={customerDetails.address}
                onChange={(e) =>
                  updateDetail("address", e.target.value)
                }
              />
            </label>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Contact */}
            <div>
              <p className="flex items-center gap-2 text-xs text-gray-500">
                <FiPhone size={13} />
                Contact
              </p>

              <p className="mt-1.5 text-sm font-medium text-text">
                {customerDetails.contact || "—"}
              </p>
            </div>

            {/* GST */}
            <div>
              <p className="text-xs text-gray-500">
                GST
              </p>

              <p className="mt-1.5 text-sm font-medium text-text">
                {customerDetails.gst || "—"}
              </p>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <p className="flex items-center gap-2 text-xs text-gray-500">
                <FiMapPin size={13} />
                Address
              </p>

              <p className="mt-1.5 text-sm font-medium leading-5 text-text">
                {customerDetails.address || "—"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInformation;