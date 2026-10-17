/* global jest, beforeEach, afterEach, describe, test, expect */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "../src/modules/auth/AuthContext";
import { getCurrentUserRequest } from "../src/modules/auth/services/auth.api";
import ProtectedRoute from "../src/shared/components/ProtectedRoute";
import EmployeeTaskManagement from "../src/modules/task/pages/EmployeeTaskManagement";
import EmployeeTaskDetails from "../src/modules/task/pages/EmployeeTaskDetails";
import TaskManagement from "../src/modules/task/pages/TaskManagement";
import {
  getTasksAPI, getTaskAPI, createTaskAPI,
  updateTaskAPI, updateTaskStatusAPI, deleteTaskAPI,
} from "../src/modules/task/services/task.api";
import api from "../src/api/axios";
import { getNavigationItems, isNavigationItemActive } from "../src/shared/navigation";

jest.mock("../src/modules/auth/services/auth.api", () => ({
  loginRequest: jest.fn(), getCurrentUserRequest: jest.fn(),
}));
jest.mock("../src/modules/task/services/task.api", () => ({
  getTasksAPI: jest.fn(), getTaskAPI: jest.fn(),
  createTaskAPI: jest.fn(), updateTaskAPI: jest.fn(),
  updateTaskStatusAPI: jest.fn(), deleteTaskAPI: jest.fn(),
}));
jest.mock("../src/api/axios", () => ({ __esModule: true, default: { get: jest.fn() } }));

const employee = {
  _id: "507f1f77bcf86cd799439011", empId: "EMP-TASK-A", name: "Employee A",
  email: "task-a@worknest.test", role: "employee", status: "active",
  permissions: ["DASHBOARD_READ", "TASK_READ", "TASK_STATUS_UPDATE"],
};
const employeeB = { ...employee, _id: "507f1f77bcf86cd799439012", empId: "EMP-TASK-B", name: "Employee B" };
const admin = {
  ...employee, _id: "507f1f77bcf86cd799439013", empId: "EMP-TASK-ADMIN", name: "Task Admin", role: "admin",
  permissions: [...employee.permissions, "EMPLOYEE_READ", "TASK_CREATE", "TASK_UPDATE", "TASK_DELETE"],
};
const originalTask = {
  _id: "507f1f77bcf86cd799439021", taskId: "TSK-FRONTEND-001", title: "Prepare customer delivery",
  description: "Check the approved work before preparing the customer delivery.",
  assignedTo: employee, assignedBy: admin, dueDate: "2035-05-12T10:30:00.000Z",
  createdAt: "2026-01-01T10:30:00.000Z", status: "pending", priority: "high",
};
const httpError = (status, message) => ({ response: { status, data: { message } }, message });

let root;
let container;
let currentTask;
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const text = () => container.textContent;
const button = (label) => Array.from(container.querySelectorAll("button")).find(node => label.test(node.textContent) || label.test(node.getAttribute("aria-label") || ""));
const click = async (node) => { expect(node).toBeTruthy(); await act(async () => { node.click(); }); await flush(); };
const change = async (selector, value) => {
  const input = container.querySelector(selector);
  expect(input).toBeTruthy();
  await act(async () => {
    const prototype = input.tagName === "SELECT" ? HTMLSelectElement.prototype : input.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event(input.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  });
};

function Location() { return <output data-current-path>{useLocation().pathname}</output>; }

async function render(path = "/employee/tasks", user = employee, extra = null) {
  getCurrentUserRequest.mockResolvedValue({ user });
  await act(async () => {
    root.render(<AuthProvider><MemoryRouter initialEntries={[path]}><Location />{extra}<Routes>
      <Route path="/" element={<p>Login page</p>} />
      <Route path="/unauthorized" element={<p>Access denied</p>} />
      <Route path="/employee/tasks" element={<ProtectedRoute allowedRoles={["employee"]} requiredPermissions={["TASK_READ"]}><EmployeeTaskManagement /></ProtectedRoute>} />
      <Route path="/employee/tasks/:taskId" element={<ProtectedRoute allowedRoles={["employee"]} requiredPermissions={["TASK_READ"]}><EmployeeTaskDetails /></ProtectedRoute>} />
      <Route path="/admin/tasks" element={<ProtectedRoute allowedRoles={["admin"]} requiredPermissions={["TASK_READ"]}><TaskManagement /></ProtectedRoute>} />
    </Routes></MemoryRouter></AuthProvider>);
  });
  await flush();
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("token", "frontend-task-test-token");
  for (const mock of [getCurrentUserRequest, getTasksAPI, getTaskAPI, createTaskAPI, updateTaskAPI, updateTaskStatusAPI, deleteTaskAPI, api.get]) mock.mockReset();
  currentTask = { ...originalTask };
  getTasksAPI.mockImplementation(async () => ({ data: [currentTask] }));
  getTaskAPI.mockImplementation(async () => ({ data: { task: currentTask } }));
  updateTaskStatusAPI.mockImplementation(async (id, status) => {
    currentTask = { ...currentTask, status };
    return { data: { message: "Task status updated successfully", task: currentTask } };
  });
  updateTaskAPI.mockResolvedValue({ data: { task: currentTask } });
  api.get.mockResolvedValue({ data: [employee, employeeB] });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

describe("assigned Employee Task list", () => {
  test("shows assigned Task fields using shared APIs without the Employee directory or Admin controls", async () => {
    await render();
    expect(text()).toContain("My Tasks");
    for (const field of [currentTask.title, currentTask.description, currentTask.status, currentTask.priority, employee.name]) expect(text()).toContain(field);
    expect(text()).not.toMatch(/undefined|Invalid Date/);
    expect(button(/^View task$/)).toBeTruthy();
    expect(button(/^Edit$|^Delete$|^Add Task$/)).toBeUndefined();
    expect(getTasksAPI).toHaveBeenCalledWith();
    expect(api.get).not.toHaveBeenCalled();
  });

  test("shows a loading state without falsely claiming the assigned list is empty", async () => {
    let resolve;
    getTasksAPI.mockReturnValue(new Promise(done => { resolve = done; }));
    await render();
    expect(text()).not.toContain(currentTask.title);
    expect(text()).not.toMatch(/No tasks|No assigned tasks/i);
    await act(async () => { resolve({ data: [currentTask] }); });
    expect(text()).toContain(currentTask.title);
  });

  test("handles an empty assigned list and allows refresh", async () => {
    getTasksAPI.mockResolvedValueOnce({ data: [] });
    await render();
    expect(text()).toMatch(/no .*tasks|no tasks/i);
    await click(button(/^Refresh$/i));
    expect(text()).toContain(currentTask.title);
    expect(getTasksAPI).toHaveBeenCalledTimes(2);
  });

  test("reports a failed list request and retries instead of treating it as empty", async () => {
    getTasksAPI.mockRejectedValueOnce(httpError(500, "Task service unavailable"));
    await render();
    expect(text()).toMatch(/Task service unavailable|couldn't|unable|error/i);
    await click(button(/retry|try again|refresh/i));
    expect(text()).toContain(currentTask.title);
  });

  test("opening a Task uses the existing business identifier and a fresh scoped detail request", async () => {
    await render();
    await click(button(/^View task$/));
    expect(container.querySelector("[data-current-path]").textContent).toBe(`/employee/tasks/${currentTask.taskId}`);
    expect(getTaskAPI).toHaveBeenCalledWith(currentTask.taskId);
    expect(text()).toContain(currentTask.description);
  });

  test("a refreshed list removes Tasks revoked by Admin reassignment", async () => {
    await render();
    getTasksAPI.mockResolvedValueOnce({ data: [] });
    await click(button(/^Refresh$/i));
    expect(text()).not.toContain(currentTask.title);
    expect(text()).toMatch(/no .*tasks|no tasks/i);
  });
});

describe("Employee Task details and status actions", () => {
  const detailPath = `/employee/tasks/${originalTask.taskId}`;

  test("pending → in-progress → done uses only the narrow status action and refetches when returning to the list", async () => {
    await render(detailPath);
    expect(text()).toContain(employee.name);
    expect(text()).toContain(admin.name);
    expect(button(/^Edit$|^Delete$/)).toBeUndefined();
    await click(button(/^Start task$/));
    expect(updateTaskStatusAPI).toHaveBeenLastCalledWith(originalTask.taskId, "in-progress");
    expect(text()).toContain("in-progress");
    await click(button(/^Mark as done$/));
    expect(updateTaskStatusAPI).toHaveBeenLastCalledWith(originalTask.taskId, "done");
    expect(text()).toContain("Completed tasks can only be reopened by an Admin");
    expect(button(/^Start task$|^Mark as done$/)).toBeUndefined();
    expect(updateTaskAPI).not.toHaveBeenCalled();
    const back = Array.from(container.querySelectorAll("a")).find(node => /Back to My Tasks/i.test(node.textContent));
    await click(back || button(/Back to My Tasks/i));
    expect(container.querySelector("[data-current-path]").textContent).toBe("/employee/tasks");
    expect(text()).toContain("done");
    expect(getTasksAPI).toHaveBeenCalled();
  });

  test("completed Task offers no backward or reopening action", async () => {
    currentTask.status = "done";
    await render(detailPath);
    expect(text()).toContain("Completed tasks can only be reopened by an Admin");
    expect(button(/Start task|Mark as done|Reopen/i)).toBeUndefined();
  });

  test("missing narrow update permission leaves details readable without mutation controls", async () => {
    await render(detailPath, { ...employee, permissions: ["TASK_READ"] });
    expect(text()).toContain(currentTask.title);
    expect(button(/Start task|Mark as done/i)).toBeUndefined();
    expect(updateTaskStatusAPI).not.toHaveBeenCalled();
  });

  test("the status control prevents duplicate clicks while the request is pending", async () => {
    let resolve;
    updateTaskStatusAPI.mockReturnValue(new Promise(done => { resolve = done; }));
    await render(detailPath);
    await click(button(/^Start task$/));
    const pendingButton = button(/updat|saving|Start task/i);
    expect(pendingButton).toBeTruthy();
    expect(pendingButton.disabled).toBe(true);
    await click(pendingButton);
    expect(updateTaskStatusAPI).toHaveBeenCalledTimes(1);
    currentTask = { ...currentTask, status: "in-progress" };
    await act(async () => { resolve({ data: { task: currentTask } }); });
    expect(button(/^Mark as done$/)).toBeTruthy();
  });

  test.each([[404, "Task not found"], [403, "You do not have permission"]])("restricted Task details handle HTTP %i without stale Task data", async (status, message) => {
    getTaskAPI.mockRejectedValueOnce(httpError(status, message));
    await render(detailPath);
    expect(text()).toMatch(status === 404 ? /not found/i : /permission|access|forbidden/i);
    expect(text()).not.toContain(currentTask.title);
    expect(button(/Start task|Mark as done/i)).toBeUndefined();
  });

  test("a failed detail request has a working retry", async () => {
    getTaskAPI.mockRejectedValueOnce(httpError(500, "Task unavailable"));
    await render(detailPath);
    expect(text()).not.toContain(currentTask.title);
    await click(button(/retry|try again/i));
    expect(text()).toContain(currentTask.title);
  });

  test("a rejected status request reports the failure and leaves the Task unchanged", async () => {
    updateTaskStatusAPI.mockRejectedValueOnce(httpError(400, "Invalid task status transition"));
    await render(detailPath);
    await click(button(/^Start task$/));
    expect(text()).toContain("Invalid task status transition");
    expect(text()).toContain("pending");
    expect(button(/^Mark as done$/)).toBeUndefined();
  });

  test("a conflict refetches the latest Task and removes obsolete status actions", async () => {
    await render(detailPath);
    currentTask = { ...currentTask, status: "done" };
    updateTaskStatusAPI.mockRejectedValueOnce(httpError(409, "Task changed. Please refresh and try again."));
    await click(button(/^Start task$/));
    expect(getTaskAPI).toHaveBeenCalledTimes(2);
    expect(text()).toContain("Task changed. Please refresh and try again.");
    expect(text()).toContain("Completed tasks can only be reopened by an Admin");
    expect(button(/Start task|Mark as done/i)).toBeUndefined();
  });

  test("revoked assignment during a status request removes protected Task data", async () => {
    await render(detailPath);
    updateTaskStatusAPI.mockRejectedValueOnce(httpError(404, "Task not found"));
    getTaskAPI.mockRejectedValueOnce(httpError(404, "Task not found"));
    await click(button(/^Start task$/));
    expect(text()).toContain("Task not found");
    expect(text()).not.toContain(currentTask.title);
    expect(button(/Start task|Mark as done/i)).toBeUndefined();
  });

  test("a delayed status response cannot overwrite a different Task after navigation", async () => {
    const nextTask = { ...originalTask, taskId: "TSK-FRONTEND-002", title: "A different assigned Task" };
    let resolve;
    updateTaskStatusAPI.mockReturnValue(new Promise(done => { resolve = done; }));
    getTaskAPI.mockImplementation(async id => ({ data: { task: id === nextTask.taskId ? nextTask : originalTask } }));
    function SwitchTask() {
      const navigate = useNavigate();
      return <button onClick={() => navigate(`/employee/tasks/${nextTask.taskId}`)}>Switch assigned Task</button>;
    }
    await render(detailPath, employee, <SwitchTask />);
    await click(button(/^Start task$/));
    await click(button(/^Switch assigned Task$/));
    expect(text()).toContain(nextTask.title);
    await act(async () => { resolve({ data: { task: { ...originalTask, status: "in-progress" } } }); });
    expect(text()).toContain(nextTask.title);
    expect(text()).not.toContain(originalTask.title);
    expect(button(/^Start task$/)).toBeTruthy();
    expect(button(/^Mark as done$/)).toBeUndefined();
    expect(getTaskAPI.mock.calls).toEqual([[originalTask.taskId], [nextTask.taskId]]);
  });

  test("missing TASK_READ denies both Task navigation and direct detail rendering", async () => {
    const user = { ...employee, permissions: ["TASK_STATUS_UPDATE"] };
    expect(getNavigationItems(user).some(item => item.path === "/employee/tasks")).toBe(false);
    await render(detailPath, user);
    expect(text()).toContain("Access denied");
    expect(getTaskAPI).not.toHaveBeenCalled();
  });

  test("nested Task routes keep My Tasks active", () => {
    const item = getNavigationItems(employee).find(entry => entry.path === "/employee/tasks");
    expect(item).toBeTruthy();
    expect(isNavigationItemActive(item, detailPath)).toBe(true);
    expect(isNavigationItemActive(item, "/employee/profile")).toBe(false);
  });
});

describe("existing Admin Task editor compatibility", () => {
  test("populated assignee and ISO date prefill correctly, and an unchanged edit preserves completed status", async () => {
    currentTask.status = "done";
    await render("/admin/tasks", admin);
    await click(button(/^Edit$/));
    expect(container.querySelector('input[name="dueDate"]').value).toBe("2035-05-12");
    expect(container.querySelector("#assignedTo").value).toContain(employee.name);
    expect(container.querySelector('select[name="status"]').value).toBe("done");
    await change('textarea[name="description"]', "Admin updated delivery notes");
    await click(button(/^Save$/));
    expect(updateTaskAPI).toHaveBeenCalledWith(originalTask.taskId, expect.objectContaining({
      assignedTo: employee._id, dueDate: "2035-05-12", status: "done", description: "Admin updated delivery notes",
    }));
    expect(updateTaskStatusAPI).not.toHaveBeenCalled();
    expect(getTasksAPI.mock.calls.length).toBeGreaterThan(1);
  });
});
