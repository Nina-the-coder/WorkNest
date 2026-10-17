// modules/task/pages/TaskManagement.jsx
import { useRef, useState } from "react";
import Header from "../../../shared/components/Header";
import CTAButton from "../../../shared/components/buttons/CTAButton";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import TaskCard from "../components/TaskCard";
import TaskTable from "../components/TaskTable";
import TaskModal from "../components/TaskModal";
import TaskFilters from "../components/TaskFilters";
import { useTasks } from "../hooks/useTasks";

const TaskManagement = () => {
  const { tasks, loading, error, refreshTasks, addTask, editTask, removeTask } = useTasks();

  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");
  const savePending = useRef(false);

  const [formData, setFormData] = useState({
    assignedTo: "",
    title: "",
    description: "",
    dueDate: "",
    status: "pending",
    priority: "medium",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [tableView] = useState(false);

  const resetForm = () => {
    setFormData({
      assignedTo: "",
      title: "",
      description: "",
      dueDate: "",
      status: "pending",
      priority: "medium",
    });
    setIsEdit(false);
    setEditTaskId(null);
    setSelectedEmployee(null);
    setFormError("");
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (savePending.current) return;
    savePending.current = true;
    setPending(true);
    setFormError("");
    try {
      if (isEdit) await editTask(editTaskId, formData);
      else await addTask(formData);
      resetForm();
      setModal(false);
    } catch (failure) {
      setFormError(failure.response?.data?.message || "Unable to save task. Please try again.");
    } finally {
      savePending.current = false;
      setPending(false);
    }
  };

  const openEdit = (task) => {
    setIsEdit(true);
    setEditTaskId(task.taskId);
    setSelectedEmployee(typeof task.assignedTo === "object" ? task.assignedTo : null);
    setFormError("");
    setFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      status: task.status,
      priority: task.priority,
    });
    setModal(true);
  };

  const handleDelete = async (taskId) => {
    setActionError("");
    try { await removeTask(taskId); }
    catch (failure) { setActionError(failure.response?.data?.message || "Unable to delete task. Please try again."); }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "" || task.status === statusFilter;

    const matchesPriority =
      priorityFilter === "" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="">
      <Header title="Task Management" />

      {modal ? (
        <TaskModal
          formData={formData}
          handleChange={handleChange}
          handleSave={handleSave}
          handleCancel={() => {
            resetForm();
            setModal(false);
          }}
          isEdit={isEdit}
          setFormData={setFormData}
          selectedEmployee={selectedEmployee}
          onEmployeeSelect={setSelectedEmployee}
          pending={pending}
          formError={formError}
        />
      ) : (
        <>
          <div className="flex gap-8 my-10">
            <TaskFilters
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
            />

            <CTAButton icon={"plus"} onClick={() => setModal(true)}>
              Add Task
            </CTAButton>
            <button type="button" onClick={refreshTasks} disabled={loading}
              className="rounded-xl border border-cta px-4 text-text disabled:opacity-50">Refresh</button>
          </div>

          {(error || actionError) && <div role="alert" className="mb-5 rounded-xl border border-red p-4 text-text">
            <p>{actionError || error.message}</p>
            {error && <button type="button" onClick={refreshTasks} disabled={loading} className="mt-2 underline">Retry</button>}
          </div>}

          {loading ? (
            <SkeletonLoader count={6} />
          ) : tableView ? (
            <TaskTable
              tasks={filteredTasks}
              handleEdit={openEdit}
              handleDelete={handleDelete}
            />
          ) : (
            <div className="flex flex-wrap gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.taskId}
                  task={task}
                  handleEdit={() => openEdit(task)}
                  handleDelete={() => handleDelete(task.taskId)}
                />
              ))}
              {!error && filteredTasks.length === 0 && <p className="text-secondary-text">No tasks found.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskManagement;
