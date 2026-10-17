import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import TaskDetails from "../components/TaskDetails";
import { useTask } from "../hooks/useTasks";
import { nextEmployeeTaskStatus } from "../task.util";

const EmployeeTaskDetails = () => {
  const { taskId } = useParams();
  const { user } = useAuth();
  const { task, loading, error, refreshTask, updateStatus, updating, updateError } = useTask(taskId);
  const nextStatus = nextEmployeeTaskStatus(task?.status);
  const canUpdateStatus = user?.permissions?.includes("TASK_STATUS_UPDATE");

  return (
    <div className="pb-8">
      <Header title="Task Details" />
      <div className="my-6 flex items-center justify-between">
        <Link to="/employee/tasks" className="text-text underline">Back to My Tasks</Link>
        <button type="button" onClick={refreshTask} disabled={loading || updating}
          className="rounded-xl border border-cta px-4 py-2 text-text disabled:opacity-50">Refresh</button>
      </div>
      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red p-4 text-text">
          <p>{error.status === 404 ? "Task not found or no longer assigned to you."
            : error.status === 403 ? "You do not have permission to view this task." : error.message}</p>
          <button type="button" onClick={refreshTask} disabled={loading || updating} className="mt-2 underline">Retry</button>
        </div>
      )}
      {loading && !task ? <SkeletonLoader count={1} /> : task && (
        <div aria-busy={loading || updating}>
          <TaskDetails task={task} />
          {updateError && <p role="alert" className="mt-4 text-red">{updateError.message}</p>}
          {canUpdateStatus && nextStatus && (
            <button type="button" onClick={() => updateStatus(nextStatus)} disabled={updating || loading}
              className="mt-6 rounded-xl bg-cta px-5 py-2 text-white disabled:opacity-50">
              {updating ? "Updating…" : nextStatus === "in-progress" ? "Start task" : "Mark as done"}
            </button>
          )}
          {task.status === "done" && <p className="mt-5 text-secondary-text">Completed tasks can only be reopened by an Admin.</p>}
        </div>
      )}
    </div>
  );
};

export default EmployeeTaskDetails;
