import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  getTasksAPI,
  getTaskAPI,
  createTaskAPI,
  updateTaskAPI,
  updateTaskStatusAPI,
  deleteTaskAPI,
} from "../services/task.api";

const taskError = (error, fallback) => ({
  status: error.response?.status,
  message: error.response?.data?.message || fallback,
});

// Populated references already contain the names needed by both roles.
// Reading tasks must never require the Admin employee directory.
export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestVersion = useRef(0);

  const refreshTasks = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getTasksAPI();
      if (version !== requestVersion.current) return false;
      setTasks(response.data);
      return true;
    } catch (failure) {
      if (version === requestVersion.current) {
        setError(taskError(failure, "Unable to load tasks. Please try again."));
        if ([403, 404].includes(failure.response?.status)) setTasks([]);
      }
      return false;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshTasks();
    const onFocus = () => {
      if (document.visibilityState !== "hidden") void refreshTasks();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      requestVersion.current += 1;
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshTasks]);

  const addTask = async (data) => {
    await createTaskAPI(data);
    toast.success("Task created successfully");
    await refreshTasks();
  };

  const editTask = async (id, data) => {
    await updateTaskAPI(id, data);
    toast.success("Task updated successfully");
    await refreshTasks();
  };

  const removeTask = async (id) => {
    await deleteTaskAPI(id);
    toast.success("Task deleted successfully");
    await refreshTasks();
  };

  return { tasks, loading, error, refreshTasks, addTask, editTask, removeTask };
};

export const useTask = (taskId) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const requestVersion = useRef(0);
  const routeVersion = useRef(0);
  const updatePending = useRef(false);

  const refreshTask = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const response = await getTaskAPI(taskId);
      if (version !== requestVersion.current) return false;
      setTask(response.data.task);
      return true;
    } catch (failure) {
      if (version === requestVersion.current) {
        setError(taskError(failure, "Unable to load this task. Please try again."));
        // Reassignment, archiving and permission changes must remove old data.
        if ([403, 404].includes(failure.response?.status)) setTask(null);
      }
      return false;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    routeVersion.current += 1;
    updatePending.current = false;
    setUpdating(false);
    setTask(null);
    setUpdateError(null);
    void refreshTask();
    const onFocus = () => {
      if (document.visibilityState !== "hidden" && !updatePending.current) {
        void refreshTask();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => {
      routeVersion.current += 1;
      requestVersion.current += 1;
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshTask]);

  const updateStatus = async (status) => {
    if (updatePending.current) return;
    updatePending.current = true;
    const route = routeVersion.current;
    setUpdating(true);
    setUpdateError(null);
    // Ignore a background read which might contain the previous status.
    requestVersion.current += 1;
    try {
      const response = await updateTaskStatusAPI(taskId, status);
      if (route !== routeVersion.current) return;
      setTask(response.data.task);
      toast.success("Task status updated");
      await refreshTask();
    } catch (failure) {
      if (route !== routeVersion.current) return;
      setUpdateError(taskError(failure, "Unable to update task status. Please try again."));
      if ([403, 404, 409].includes(failure.response?.status)) await refreshTask();
    } finally {
      if (route === routeVersion.current) {
        updatePending.current = false;
        setUpdating(false);
      }
    }
  };

  return { task, loading, error, refreshTask, updateStatus, updating, updateError };
};
