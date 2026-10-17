import { useNavigate } from "react-router-dom";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import TaskCard from "../components/TaskCard";
import { useTasks } from "../hooks/useTasks";

const EmployeeTaskManagement = () => {
  const navigate = useNavigate();
  const { tasks, loading, error, refreshTasks } = useTasks();

  return (
    <div className="pb-8">
      <Header title="My Tasks" />
      <div className="my-6 flex items-center justify-between gap-4">
        <p className="text-secondary-text">Tasks currently assigned to you.</p>
        <button type="button" onClick={refreshTasks} disabled={loading}
          className="rounded-xl border border-cta px-4 py-2 text-text disabled:opacity-50">
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {error && (
        <div role="alert" className="mb-5 rounded-xl border border-red p-4 text-text">
          <p>{error.status === 403 ? "You do not have permission to view tasks." : error.message}</p>
          <button type="button" onClick={refreshTasks} disabled={loading} className="mt-2 underline">Retry</button>
        </div>
      )}
      {loading && tasks.length === 0 ? <SkeletonLoader count={3} /> : (
        <div className="flex flex-wrap gap-4" aria-busy={loading}>
          {tasks.map((task) => (
            <TaskCard key={task.taskId} task={task}
              onView={() => navigate(`/employee/tasks/${encodeURIComponent(task.taskId)}`)} />
          ))}
          {!loading && !error && tasks.length === 0 && (
            <p className="rounded-2xl bg-card-bg p-6 text-secondary-text">No tasks are assigned to you yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeTaskManagement;
