// modules/task/pages/TaskManagement.jsx
import { useState } from "react";
import Header from "../../../shared/components/Header";
import CTAButton from "../../../shared/components/buttons/CTAButton";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import TaskCard from "../components/TaskCard";
import TaskTable from "../components/TaskTable";
import TaskModal from "../components/TaskModal";
import TaskFilters from "../components/TaskFilters";
import { useTasks } from "../hooks/useTasks";

const TaskManagement = () => {
  const { tasks, loading, addTask, editTask, removeTask } = useTasks();

  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);

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
  const [tableView, setTableView] = useState(false);

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
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const payload = { ...formData, assignedBy: currentUser._id };

    if (isEdit) {
      await editTask(editTaskId, payload);
    } else {
      await addTask(payload);
    }
    resetForm();
    setModal(false);
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
          </div>

          {loading ? (
            <SkeletonLoader count={6} />
          ) : tableView ? (
            <TaskTable
              tasks={filteredTasks}
              handleEdit={(task) => {
                setIsEdit(true);
                setEditTaskId(task.taskId);
                setFormData(task);
                setModal(true);
              }}
              handleDelete={(id) => removeTask(id)}
            />
          ) : (
            <div className="flex flex-wrap gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.taskId}
                  task={task}
                  handleEdit={() => {
                    setIsEdit(true);
                    setEditTaskId(task.taskId);
                    setFormData(task);
                    setModal(true);
                  }}
                  handleDelete={() => removeTask(task.taskId)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskManagement;
