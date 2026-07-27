// modules/customer/components/CustomerModal.jsx
import EmployeeComboBox from "../../../shared/components/combobox/EmployeeComboBox";
import VariantButton from "../../../shared/components/buttons/VariantButton";
import LabelInput from "../../../shared/components/Labelnput";

const CustomerModal = ({
  formData,
  setFormData,
  handleChange,
  handleSave,
  handleCancel,
  isEdit,
}) => {
  return (
    <div className="w-fit rounded-2xl mx-auto mt-16 p-8 bg-card-bg">
      <div className="text-[20px] flex justify-center mb-8">
        {isEdit ? "Edit Customer" : "Add New Customer"}
      </div>

      <form className="flex flex-col items-center gap-4">
        <EmployeeComboBox
          labelName="Select the connected Employee"
          onSelect={(emp) =>
            setFormData((prev) => ({
              ...prev,
              addedBy: emp._id,
            }))
          }
        />
        <LabelInput
          labelName="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />

        <LabelInput
          labelName="Address"
          name="address"
          value={formData.address}
          onChange={handleChange}
        />

        <LabelInput
          labelName="Contact"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
        />

        <LabelInput
          labelName="GST"
          name="gst"
          value={formData.gst}
          onChange={handleChange}
        />

        <LabelInput
          labelName="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />

        <div className="flex gap-6 mt-8">
          <VariantButton
            onClick={handleCancel}
            variant="ghostRed"
            size="medium"
            text="Cancel"
          />
          <VariantButton
            onClick={handleSave}
            variant="cta"
            size="medium"
            text="Save"
          />
        </div>
      </form>
    </div>
  );
};

export default CustomerModal;
