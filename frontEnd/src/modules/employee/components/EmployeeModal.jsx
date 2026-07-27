// modules/employee/components/EmployeeModal.jsx
import VariantButton from "../../../shared/components/buttons/VariantButton";
import LabelInput from "../../../shared/components/Labelnput";

const EmployeeModal = ({
  formData,
  handleChange,
  handleSave,
  handleCancel,
  isEdit,
}) => {
  return (
    <div className="w-fit rounded-2xl mx-auto mt-16 p-8 bg-card-bg">
      <div className="text-[20px] flex justify-center mb-8">
        {isEdit ? "Edit Employee" : "Add New Employee"}
      </div>

      <form className="flex flex-col items-center gap-4">
        <LabelInput
          labelName="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
        />

        <LabelInput
          labelName="Email"
          name="email"
          value={formData.email}
          onChange={handleChange}
        />

        <LabelInput
          labelName="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />

        <LabelInput
          labelName="Password"
          name="password"
          inputType="password"
          value={formData.password}
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

export default EmployeeModal;
