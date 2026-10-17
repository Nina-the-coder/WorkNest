// modules/customer/components/CustomerModal.jsx
import VariantButton from "../../../shared/components/buttons/VariantButton";

const CustomerModal = ({
  formData,
  handleChange,
  handleSave,
  handleCancel,
  isEdit,
  pending,
  error,
}) => {
  const fields = [
    ["Name", "name", "text"], ["Address", "address", "text"],
    ["Contact", "contact", "text"], ["GST", "gst", "text"], ["Email", "email", "email"],
  ];
  return (
    <div className="w-full max-w-xl rounded-2xl mx-auto mt-16 p-8 bg-card-bg">
      <div className="text-[20px] flex justify-center mb-8">
        {isEdit ? "Edit Customer" : "Add New Customer"}
      </div>

      <form noValidate onSubmit={(event) => { event.preventDefault(); void handleSave(); }}>
        <fieldset disabled={pending} aria-busy={pending} className="flex flex-col items-center gap-4">
          {fields.map(([label, name, type]) => (
            <div key={name} className="w-full flex flex-col">
              <label htmlFor={`customer-${name}`} className="ml-2 mb-0.5 text-secondary-text">{label}{name === "name" ? " *" : ""}</label>
              <input id={`customer-${name}`} type={type} name={name} value={formData[name]}
                aria-required={name === "name"} onChange={handleChange}
                className="w-full h-[30px] bg-bg rounded-xl px-2" />
            </div>
          ))}
          <div className="w-full flex flex-col">
            <label htmlFor="customer-status" className="ml-2 mb-0.5 text-secondary-text">Status</label>
            <select id="customer-status" name="status" value={formData.status} onChange={handleChange} className="h-[30px] rounded-xl bg-bg px-2">
              <option value="active">Active</option><option value="inactive">Inactive</option>
              {!["active", "inactive"].includes(formData.status) && <option value={formData.status}>{formData.status || "Not specified"}</option>}
            </select>
          </div>
          <div className="w-full flex flex-col">
            <label htmlFor="customer-company-type" className="ml-2 mb-0.5 text-secondary-text">Company Type</label>
            <select id="customer-company-type" name="companyType" value={formData.companyType} onChange={handleChange} className="h-[30px] rounded-xl bg-bg px-2">
              <option value="dealer">Dealer</option><option value="doctor">Doctor</option>
              {!["dealer", "doctor"].includes(formData.companyType) && <option value={formData.companyType}>{formData.companyType || "Not specified"}</option>}
            </select>
          </div>
          {error && <p role="alert" className="text-red">{error}</p>}
          <div className="flex gap-6 mt-8">
            <VariantButton onClick={handleCancel} variant="ghostRed" size="medium" text="Cancel" />
            <button type="submit" className="h-[28px] w-[100px] rounded-xl border-2 border-cta bg-cta text-white disabled:opacity-50">
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </fieldset>
      </form>
    </div>
  );
};

export default CustomerModal;
