// modules/task/components/TaskModal.jsx
import VariantButton from "../../../shared/components/buttons/VariantButton";
import EmployeeComboBox from "../../../shared/components/combobox/EmployeeComboBox";
import LabelInput from "../../../shared/components/Labelnput";

const TaskModal = ({
  formData,
  handleChange,
  handleSave,
  handleCancel,
  isEdit,
  setFormData,
}) => {
  return (
    <div className="w-fit rounded-2xl mx-auto mt-16 p-8 bg-card-bg">
      <div className="text-[20px] flex justify-center mb-8">
        {isEdit ? "Edit Task" : "Add New Task"}
      </div>

      <form className="flex flex-col items-center gap-4">
        <EmployeeComboBox
          onSelect={(emp) =>
            setFormData((prev) => ({
              ...prev,
              assignedTo: emp._id,
            }))
          }
        />

        <LabelInput
          labelName="Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />

        <div className="flex flex-col w-full">
          <label className="ml-2 mb-0.5 text-secondary-text">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full h-[80px] bg-bg rounded-xl px-2"
          />
        </div>

        <LabelInput
          inputType="date"
          labelName="Due Date"
          name="dueDate"
          value={formData.dueDate}
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

export default TaskModal;
