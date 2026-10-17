import EmployeeComboBox from "../../../shared/components/combobox/EmployeeComboBox";
import LabelInput from "../../../shared/components/Labelnput";

const TaskModal = ({
  formData,
  handleChange,
  handleSave,
  handleCancel,
  isEdit,
  setFormData,
  selectedEmployee,
  onEmployeeSelect,
  pending = false,
  formError,
}) => (
  <div className="w-fit rounded-2xl mx-auto mt-16 p-8 bg-card-bg">
    <div className="text-[20px] flex justify-center mb-8">{isEdit ? "Edit Task" : "Add New Task"}</div>
    <form className="flex flex-col items-center gap-4" onSubmit={(event) => { event.preventDefault(); if (!pending) handleSave(); }}>
      <EmployeeComboBox selected={selectedEmployee || formData.assignedTo} employeesOnly
        onSelect={(employee) => {
          setFormData((previous) => ({ ...previous, assignedTo: employee._id }));
          onEmployeeSelect?.(employee);
        }} />
      <LabelInput labelName="Title" name="title" value={formData.title} onChange={handleChange} />
      <div className="flex flex-col w-full">
        <label htmlFor="task-description" className="ml-2 mb-0.5 text-secondary-text">Description</label>
        <textarea id="task-description" name="description" value={formData.description}
          onChange={handleChange} className="w-full h-[80px] bg-bg rounded-xl px-2" />
      </div>
      <LabelInput inputType="date" labelName="Due Date" name="dueDate" value={formData.dueDate} onChange={handleChange} />
      <div className="grid w-full grid-cols-2 gap-4">
        <label className="flex flex-col text-secondary-text" htmlFor="task-status">Status
          <select id="task-status" name="status" value={formData.status} onChange={handleChange}
            className="mt-1 rounded-xl bg-bg p-2 text-text">
            <option value="pending">pending</option>
            <option value="in-progress">in-progress</option>
            <option value="done">done</option>
          </select>
        </label>
        <label className="flex flex-col text-secondary-text" htmlFor="task-priority">Priority
          <select id="task-priority" name="priority" value={formData.priority} onChange={handleChange}
            className="mt-1 rounded-xl bg-bg p-2 text-text">
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </label>
      </div>
      {formError && <p role="alert" className="text-red">{formError}</p>}
      <div className="flex gap-6 mt-8">
        <button type="button" disabled={pending} onClick={handleCancel}
          className="rounded-xl border-2 border-red px-4 py-1 text-text disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={pending}
          className="rounded-xl border-2 border-cta bg-cta px-4 py-1 text-white disabled:opacity-50">{pending ? "Saving…" : "Save"}</button>
      </div>
    </form>
  </div>
);

export default TaskModal;
