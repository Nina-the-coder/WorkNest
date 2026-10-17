/* global jest, beforeEach, afterEach, describe, test, expect */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../src/modules/auth/AuthContext";
import { useAuth } from "../src/modules/auth/useAuth";
import { loginRequest, getCurrentUserRequest } from "../src/modules/auth/services/auth.api";
import ProtectedRoute from "../src/shared/components/ProtectedRoute";
import Login from "../src/modules/auth/pages/Login";
import Profile from "../src/modules/profile/Profile";
import Sidebar from "../src/shared/components/Sidebar";
import EmployeeDashboard from "../src/modules/dashboard/EmployeeDashboard";
import { getNavigationItems, isNavigationItemActive } from "../src/shared/navigation";

jest.mock("../src/modules/auth/services/auth.api", () => ({
  loginRequest: jest.fn(),
  getCurrentUserRequest: jest.fn(),
}));

const employee = {
  _id: "507f1f77bcf86cd799439011",
  name: "Employee Session Test",
  email: "employee@worknest.test",
  empId: "EMP-SESSION-TEST",
  role: "employee",
  status: "active",
  permissions: ["DASHBOARD_READ", "TASK_READ", "CUSTOMER_READ", "PRODUCT_READ", "QUOTATION_READ"],
};
const admin = { ...employee, _id: "507f1f77bcf86cd799439012", name: "Admin Session Test", role: "admin", permissions: [...employee.permissions, "EMPLOYEE_READ", "ORDER_READ"] };

let root;
let container;
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const text = () => container.textContent;
const path = () => container.querySelector("[data-current-path]")?.textContent;
const button = (label) => Array.from(container.querySelectorAll("button")).find((node) => label.test(node.textContent) || label.test(node.getAttribute("aria-label") || ""));
const click = async (node) => { expect(node).toBeTruthy(); await act(async () => { node.click(); }); };
const cached = (user = employee) => {
  localStorage.setItem("token", "test-existing-token");
  localStorage.setItem("user", JSON.stringify(user));
};
const httpError = (status, message = "Session rejected") => ({ response: { status, data: { message } }, message });

function Location() {
  return <output data-current-path>{useLocation().pathname}</output>;
}

function SessionView() {
  const { user, status, login, logout, refreshSession } = useAuth();
  return <>
    <output data-session-state>{JSON.stringify({ user, status })}</output>
    <button onClick={() => logout()}>End session</button>
    <button onClick={() => login({ email: employee.email, password: "test-only-password" })}>Sign in again</button>
    <button onClick={() => refreshSession()}>Refresh session</button>
    <p>Protected employee content</p>
  </>;
}

async function render(content, initialPath = "/employee/profile") {
  await act(async () => {
    root.render(<AuthProvider><MemoryRouter initialEntries={[initialPath]}><Location />{content}</MemoryRouter></AuthProvider>);
  });
  await flush();
}

const guardedRoutes = (content = <SessionView />, requiredPermissions) => <Routes>
  <Route path="/" element={<p>Public login page</p>} />
  <Route path="/unauthorized" element={<p>Access denied</p>} />
  <Route path="/employee/profile" element={<ProtectedRoute allowedRoles={["employee"]} requiredPermissions={requiredPermissions}>{content}</ProtectedRoute>} />
  <Route path="/admin/tasks" element={<ProtectedRoute allowedRoles={["admin"]}><p>Admin task content</p></ProtectedRoute>} />
</Routes>;

beforeEach(() => {
  localStorage.clear();
  loginRequest.mockReset();
  getCurrentUserRequest.mockReset();
  getCurrentUserRequest.mockResolvedValue({ user: employee });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

describe("authoritative session hydration and route protection", () => {
  test("unauthenticated protected navigation redirects to the existing login route", async () => {
    await render(guardedRoutes());
    expect(path()).toBe("/");
    expect(text()).not.toContain("Protected employee content");
    expect(getCurrentUserRequest).not.toHaveBeenCalled();
  });

  test("refresh restores an Employee from the current-user API", async () => {
    cached();
    await render(guardedRoutes());
    expect(path()).toBe("/employee/profile");
    expect(text()).toContain(employee.name);
    expect(getCurrentUserRequest).toHaveBeenCalledTimes(1);
  });

  test("hydration neither redirects nor displays cached protected data while verification is pending", async () => {
    cached({ ...admin, name: "Untrusted cached name" });
    let resolve;
    getCurrentUserRequest.mockReturnValue(new Promise((done) => { resolve = done; }));
    await render(guardedRoutes());
    expect(path()).toBe("/employee/profile");
    expect(text()).not.toContain("Protected employee content");
    expect(text()).not.toContain("Untrusted cached name");
    expect(text()).not.toContain("Public login page");
    await act(async () => { resolve({ user: employee }); });
    expect(text()).toContain("Protected employee content");
  });

  test("malformed cached user does not crash and is replaced by verified identity", async () => {
    localStorage.setItem("token", "test-existing-token");
    localStorage.setItem("user", "{malformed");
    await render(guardedRoutes());
    expect(text()).toContain(employee.name);
    expect(JSON.parse(localStorage.getItem("user")).role).toBe("employee");
  });

  test("forged cached Admin role cannot grant Admin-page access", async () => {
    cached(admin);
    await render(guardedRoutes(), "/admin/tasks");
    expect(path()).toBe("/unauthorized");
    expect(text()).not.toContain("Admin task content");
    expect(JSON.parse(localStorage.getItem("user")).role).toBe("employee");
  });

  test("an active Admin retains their protected route", async () => {
    cached(admin);
    getCurrentUserRequest.mockResolvedValue({ user: admin });
    await render(guardedRoutes(), "/admin/tasks");
    expect(path()).toBe("/admin/tasks");
    expect(text()).toContain("Admin task content");
  });

  test.each([[[]], [["TASK_READ"]]])("missing required permission denies the leaf route (%j)", async (permissions) => {
    cached();
    getCurrentUserRequest.mockResolvedValue({ user: { ...employee, permissions } });
    await render(guardedRoutes(<SessionView />, ["QUOTATION_READ"]));
    expect(path()).toBe("/unauthorized");
    expect(text()).not.toContain("Protected employee content");
    expect(localStorage.getItem("token")).toBeTruthy();
  });

  test("expired/disabled session clears only WorkNest authentication storage and redirects", async () => {
    cached();
    localStorage.setItem("theme", "dark");
    getCurrentUserRequest.mockRejectedValue(httpError(401));
    await render(guardedRoutes());
    expect(path()).toBe("/");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  test("temporary verification failure hides protected content and permits retry", async () => {
    cached();
    getCurrentUserRequest.mockRejectedValueOnce(new Error("Development backend unavailable"));
    await render(guardedRoutes());
    expect(path()).toBe("/employee/profile");
    expect(text()).not.toContain("Protected employee content");
    expect(text()).not.toContain("Public login page");
    expect(localStorage.getItem("token")).toBe("test-existing-token");
    await click(button(/retry|try again/i));
    await flush();
    expect(text()).toContain("Protected employee content");
  });

  test("logout clears identity and blocks protected content without clearing other preferences", async () => {
    cached();
    localStorage.setItem("theme", "dark");
    await render(guardedRoutes());
    await click(button(/End session/));
    expect(path()).toBe("/");
    expect(text()).not.toContain(employee.email);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  test("an in-flight hydration response cannot restore a logged-out session", async () => {
    cached();
    let resolve;
    getCurrentUserRequest.mockReturnValue(new Promise((done) => { resolve = done; }));
    function PendingLogout() { return <button onClick={useAuth().logout}>Logout during loading</button>; }
    await render(<><PendingLogout />{guardedRoutes()}</>);
    await click(button(/Logout during loading/));
    await act(async () => { resolve({ user: employee }); });
    expect(path()).toBe("/");
    expect(text()).not.toContain("Protected employee content");
    expect(localStorage.getItem("token")).toBeNull();
  });
});

describe("login and shared navigation", () => {
  const loginRoutes = <Routes>
    <Route path="/" element={<Login />} />
    <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><p>Admin landing</p></ProtectedRoute>} />
    <Route path="/employee/dashboard" element={<ProtectedRoute allowedRoles={["employee"]}><p>Employee landing</p></ProtectedRoute>} />
  </Routes>;

  async function fillLogin() {
    await act(async () => {
      for (const [selector, value] of [["#email", employee.email], ["#password", "test-only-password"]]) {
        const input = container.querySelector(selector);
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await act(async () => { container.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    await flush();
  }

  test.each([["employee", employee], ["admin", admin]])("valid %s login reaches its own landing page", async (role, user) => {
    loginRequest.mockResolvedValue({ token: "new-test-token", user: { ...user, name: "Login response name" } });
    getCurrentUserRequest.mockResolvedValue({ user });
    await render(loginRoutes, "/");
    await fillLogin();
    expect(loginRequest).toHaveBeenCalledWith({ email: employee.email, password: "test-only-password" });
    expect(path()).toBe(`/${role}/dashboard`);
    expect(localStorage.getItem("token")).toBe("new-test-token");
    expect(JSON.parse(localStorage.getItem("user")).name).toBe(user.name);
  });

  test("invalid login remains public and reports the API error", async () => {
    loginRequest.mockRejectedValue(httpError(401, "Invalid credentials"));
    await render(loginRoutes, "/");
    await fillLogin();
    expect(path()).toBe("/");
    expect(text()).toContain("Invalid credentials");
    expect(localStorage.getItem("token")).toBeNull();
  });

  test("window focus while login is pending does not invalidate the successful login", async () => {
    let resolve;
    loginRequest.mockReturnValue(new Promise((done) => { resolve = done; }));
    await render(loginRoutes, "/");
    await fillLogin();
    await act(async () => { window.dispatchEvent(new Event("focus")); });
    await act(async () => { resolve({ token: "new-test-token", user: employee }); });
    await flush();
    expect(path()).toBe("/employee/dashboard");
    expect(localStorage.getItem("token")).toBe("new-test-token");
  });

  test("existing valid session skips the login form", async () => {
    cached();
    await render(loginRoutes, "/");
    expect(path()).toBe("/employee/dashboard");
    expect(container.querySelector("#password")).toBeNull();
  });

  test("Employee menu contains only registered functional destinations and no Admin or Order links", async () => {
    cached();
    await render(<Sidebar role="employee" />);
    const links = Array.from(container.querySelectorAll("nav a"));
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/employee/dashboard", "/employee/tasks", "/employee/customers", "/employee/products", "/employee/quotations", "/employee/profile"]);
    expect(links.map((link) => link.textContent).join(" ")).not.toMatch(/Orders|Employees/);
    expect(getNavigationItems(employee).map((item) => item.path)).toEqual(links.map((link) => link.getAttribute("href")));
  });

  test("navigation uses verified permissions; Profile remains available without dashboard permission", async () => {
    cached();
    getCurrentUserRequest.mockResolvedValue({ user: { ...employee, permissions: [] } });
    await render(<Sidebar />);
    expect(Array.from(container.querySelectorAll("nav a")).map((link) => link.getAttribute("href"))).toEqual(["/employee/profile"]);
  });

  test("Admin navigation retains all existing module destinations", () => {
    expect(getNavigationItems(admin).map((item) => item.path)).toEqual([
      "/admin/dashboard", "/admin/employees", "/admin/tasks", "/admin/products", "/admin/customers", "/admin/quotations", "/admin/orders", "/admin/profile",
    ]);
  });

  test("Customer and Product navigation require their own read permissions", () => {
    const limited = { ...employee, permissions: ["CUSTOMER_CREATE", "QUOTATION_READ"] };
    expect(getNavigationItems(limited).map((item) => item.path)).toEqual([
      "/employee/quotations", "/employee/profile",
    ]);
  });

  test("Customer details keep Customers active without matching unrelated catalog paths", () => {
    const customerItem = getNavigationItems(employee).find((item) => item.path === "/employee/customers");
    const productItem = getNavigationItems(employee).find((item) => item.path === "/employee/products");
    expect(isNavigationItemActive(customerItem, "/employee/customers/CUST007")).toBe(true);
    expect(isNavigationItemActive(customerItem, "/employee/products")).toBe(false);
    expect(isNavigationItemActive(productItem, "/employee/products-extra")).toBe(false);
  });

  test("nested quotation pages keep the Quotations navigation item active", () => {
    const item = getNavigationItems(employee).find((entry) => entry.path === "/employee/quotations");
    expect(isNavigationItemActive(item, "/employee/quotations/507f1f77bcf86cd799439013")).toBe(true);
    expect(isNavigationItemActive(item, "/employee/quotation")).toBe(true);
    expect(isNavigationItemActive(item, "/employee/profile")).toBe(false);
  });

  test("shared Sidebar logout is visible and clears the active session", async () => {
    cached();
    await render(guardedRoutes(<Sidebar />));
    await click(button(/log\s*out|sign\s*out/i));
    expect(path()).toBe("/");
    expect(localStorage.getItem("user")).toBeNull();
  });
});

describe("self profile and stable Employee landing", () => {
  test("Profile displays verified self-data, never the cached user or authentication secrets", async () => {
    cached({ ...employee, name: "Wrong cached employee" });
    getCurrentUserRequest.mockResolvedValue({ user: { ...employee, phone: "9876543210", password: "$2b$12$DO-NOT-RENDER", refreshToken: "DO-NOT-RENDER-TOKEN" } });
    await render(guardedRoutes(<Profile />));
    expect(text()).toContain(employee.name);
    expect(text()).toContain(employee.email);
    expect(text()).toContain(employee.empId);
    expect(text()).toContain("9876543210");
    expect(text()).not.toContain("Wrong cached employee");
    expect(text()).not.toMatch(/DO-NOT-RENDER|password|refreshToken/i);
    expect(container.querySelector("input,textarea,form")).toBeNull();
  });

  test.each([undefined, null, "not-a-date"])("missing optional fields and date %j render gracefully", async (createdAt) => {
    cached();
    getCurrentUserRequest.mockResolvedValue({ user: { ...employee, empId: undefined, createdAt } });
    await render(guardedRoutes(<Profile />));
    expect(text()).toContain(employee.name);
    expect(text()).not.toMatch(/undefined|Invalid Date|null/);
  });

  test("Admin uses the same self-profile without Employee-directory access", async () => {
    cached(admin);
    getCurrentUserRequest.mockResolvedValue({ user: admin });
    await render(<Profile />, "/admin/profile");
    expect(text()).toContain(admin.name);
    expect(text()).toContain(admin.email);
    expect(getCurrentUserRequest).toHaveBeenCalledTimes(1);
  });

  test("Employee landing is stable and has no legacy or global-metrics data requests", async () => {
    cached();
    await render(<EmployeeDashboard />, "/employee/dashboard");
    expect(text()).toMatch(/dashboard|welcome|home/i);
    expect(text()).toContain(employee.name);
    const links = Array.from(container.querySelectorAll("a")).map((node) => node.getAttribute("href"));
    expect(links).toContain("/employee/profile");
    expect(links.every((href) => href.startsWith("/employee/"))).toBe(true);
    expect(getCurrentUserRequest).toHaveBeenCalledTimes(1);
    expect(loginRequest).not.toHaveBeenCalled();
  });
});
