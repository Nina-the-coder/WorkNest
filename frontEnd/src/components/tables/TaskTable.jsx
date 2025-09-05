import React from "react";
import VariantButton from "../buttons/VariantButton";

const TaskTable = ({ tasks, handleEdit, handleDelete }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="w-full flex justify-center items-center p-6 text-secondary-text">
        No tasks found
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-card-bg/50 rounded-2xl shadow-md shadow-secondary-text/30">
      <table className="w-full text-sm text-left text-secondary-text border-collapse">
        {/* Header */}
        <thead className="text-xs uppercase bg-card-bg text-text">
          <tr>
            <th className="px-6 py-3">Task ID</th>
            <th className="px-6 py-3">Title</th>
            <th className="px-6 py-3">Assigned To</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Priority</th>
            <th className="px-6 py-3">Due Date</th>
            <th className="px-6 py-3">Description</th>
            <th className="px-6 py-3 text-center">Actions</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {tasks.map((task) => (
            <tr
              key={task.taskId}
              className="border-b border-gray-700 hover:bg-bg/50 transition"
            >
              <td className="px-6 py-4 font-medium text-text">{task.taskId}</td>
              <td className="px-6 py-4">{task.title}</td>
              <td className="px-6 py-4">
                {task.assignedTo?.name} ({task.assignedTo?.empId})
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    task.status === "done"
                      ? "bg-green text-black"
                      : task.status === "in-progress"
                      ? "bg-orange text-black"
                      : "bg-red text-white"
                  }`}
                >
                  {task.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    task.priority === "low"
                      ? "bg-green text-black"
                      : task.priority === "medium"
                      ? "bg-orange text-black"
                      : "bg-red text-white"
                  }`}
                >
                  {task.priority}
                </span>
              </td>
              <td className="px-6 py-4">
                {new Date(task.dueDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-6 py-4 max-w-[200px] truncate">
                {task.description}
              </td>
              <td className="px-6 py-4 flex gap-2 justify-center">
                <VariantButton
                  onClick={() => handleEdit(task)}
                  variant="ghostCta"
                  size="tiny"
                  text=""
                  icon="pen"
                />
                <VariantButton
                  onClick={() => handleDelete(task.taskId)}
                  variant="ghostRed"
                  size="tiny"
                  text=""
                  icon="trash-2"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
