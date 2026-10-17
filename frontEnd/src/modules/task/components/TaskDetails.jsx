import { formatTaskAssignee, formatTaskDate } from "../task.util";

const TaskDetails = ({ task }) => (
  <article className="rounded-2xl border border-border-color bg-card-bg p-6 text-text">
    <p className="text-sm text-secondary-text">{task.taskId}</p>
    <h1 className="mt-2 text-2xl font-semibold">{task.title}</h1>
    <p className="mt-4 whitespace-pre-wrap text-secondary-text">{task.description}</p>
    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
      {[
        ["Status", task.status],
        ["Priority", task.priority],
        ["Assigned employee", formatTaskAssignee(task.assignedTo)],
        ["Assigned by", formatTaskAssignee(task.assignedBy)],
        ["Due date", formatTaskDate(task.dueDate)],
        ["Created", formatTaskDate(task.createdAt)],
      ].map(([label, value]) => (
        <div key={label}>
          <dt className="text-sm text-secondary-text">{label}</dt>
          <dd className="mt-1">{value || "Not set"}</dd>
        </div>
      ))}
    </dl>
  </article>
);

export default TaskDetails;
