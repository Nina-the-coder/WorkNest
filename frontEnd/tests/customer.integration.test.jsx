/* global jest, beforeEach, afterEach, describe, test, expect */
import { act } from "react";
import { webcrypto } from "node:crypto";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider } from "../src/modules/auth/AuthContext";
import { getCurrentUserRequest } from "../src/modules/auth/services/auth.api";
import CustomerManagement from "../src/modules/customer/pages/CustomerManagement";
import CustomerDetails from "../src/modules/customer/pages/CustomerDetails";
import { getCustomersAPI, getCustomerAPI, createCustomerAPI, updateCustomerAPI, deleteCustomerAPI } from "../src/modules/customer/services/customer.api";

jest.mock("../src/modules/auth/services/auth.api", () => ({ loginRequest: jest.fn(), getCurrentUserRequest: jest.fn() }));
jest.mock("../src/modules/customer/services/customer.api", () => ({
  getCustomersAPI: jest.fn(), getCustomerAPI: jest.fn(), createCustomerAPI: jest.fn(),
  updateCustomerAPI: jest.fn(), deleteCustomerAPI: jest.fn(),
}));
jest.mock("react-toastify", () => ({ toast: { success: jest.fn() } }));

const employee = { _id: "employee-a", name: "Employee A", email: "acquisition-a@worknest.test", role: "employee", status: "active", permissions: ["CUSTOMER_READ", "CUSTOMER_CREATE"] };
const admin = { ...employee, _id: "admin", name: "Admin", role: "admin", permissions: [...employee.permissions, "CUSTOMER_UPDATE", "CUSTOMER_ARCHIVE"] };
const first = {
  _id: "customer-one", customerId: "CUST001", name: "Acquired Customer", address: "Business Street",
  contact: "+91 12345 67890", email: "customer@worknest.test", gst: "GST reference", status: "active", companyType: "dealer",
  addedBy: { _id: employee._id, name: employee.name, email: employee.email }, createdAt: "2026-05-01T10:00:00Z",
};
const second = { ...first, _id: "customer-two", customerId: "CUST002", name: "Doctor Customer", companyType: "doctor", status: "inactive" };
const failure = (status, message) => ({ response: { status, data: { message } } });
let container, root, current, navigate;
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const text = () => container.textContent;
const button = (label) => Array.from(container.querySelectorAll("button")).find((node) => label.test(node.textContent) || label.test(node.getAttribute("aria-label") || ""));
const click = async (node) => { expect(node).toBeTruthy(); await act(async () => node.click()); await flush(); };
const input = async (name, value) => {
  const node = container.querySelector(`[name="${name}"]`);
  expect(node).toBeTruthy();
  await act(async () => {
    const prototype = node.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(node, value);
    node.dispatchEvent(new Event(node.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  });
  await flush();
};
const filter = async (index, value) => {
  const node = container.querySelectorAll("select")[index];
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(node, value);
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await flush();
};
function Navigator() { navigate = useNavigate(); return null; }
async function render(path = "/employee/customers", user = employee) {
  getCurrentUserRequest.mockResolvedValue({ user });
  await act(async () => root.render(<AuthProvider><MemoryRouter initialEntries={[path]}><Navigator /><Routes>
    <Route path="/employee/customers" element={<CustomerManagement />} />
    <Route path="/employee/customers/:customerId" element={<CustomerDetails />} />
    <Route path="/admin/customers" element={<CustomerManagement />} />
    <Route path="/admin/customers/:customerId" element={<CustomerDetails />} />
  </Routes></MemoryRouter></AuthProvider>));
  await flush();
}
beforeEach(() => {
  // This repository's older jsdom predates the browser Web Crypto API.
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  localStorage.clear(); localStorage.setItem("token", "customer-test-token");
  for (const mock of [getCurrentUserRequest, getCustomersAPI, getCustomerAPI, createCustomerAPI, updateCustomerAPI, deleteCustomerAPI]) mock.mockReset();
  current = JSON.parse(JSON.stringify([first, second]));
  getCustomersAPI.mockImplementation(async () => ({ data: current }));
  getCustomerAPI.mockImplementation(async (id) => ({ data: current.find((customer) => customer.customerId === id) }));
  createCustomerAPI.mockImplementation(async (data) => {
    const customer = { ...data, _id: "created-customer", customerId: "CUST003", addedBy: employee };
    current = [...current, customer]; return { data: { message: "Customer added successfully", customer } };
  });
  updateCustomerAPI.mockImplementation(async (id, data) => {
    current = current.map((customer) => customer.customerId === id ? { ...customer, ...data } : customer);
    return { data: { message: "Customer updated successfully", customer: current.find((customer) => customer.customerId === id) } };
  });
  deleteCustomerAPI.mockImplementation(async (id) => { current = current.filter((customer) => customer.customerId !== id); return { data: { message: "Customer deleted successfully" } }; });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks(); });

describe("Shared Customer Management", () => {
  test("Employee reads shared customers and has create without administrative controls", async () => {
    await render();
    expect(text()).toContain(first.name); expect(text()).toContain(second.name);
    expect(button(/^Add Customer$/)).toBeTruthy();
    expect(button(/^Edit |^Archive /)).toBeUndefined();
    expect(container.querySelector('a[href="/employee/customers/CUST001"]')).toBeTruthy();
  });
  test("read-only permission hides customer creation too", async () => {
    await render("/employee/customers", { ...employee, permissions: ["CUSTOMER_READ"] });
    expect(text()).toContain(first.name); expect(button(/^Add Customer$/)).toBeUndefined();
  });
  test("existing search matches names and customer codes", async () => {
    await render();
    const search = container.querySelector('input[placeholder="Search customer"]');
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(search, "CUST002");
      search.dispatchEvent(new Event("input", { bubbles: true }));
    }); await flush();
    expect(text()).toContain(second.name); expect(text()).not.toContain(first.name);
  });
  test("status and company type filters both apply", async () => {
    await render(); await filter(0, "active");
    expect(text()).toContain(first.name); expect(text()).not.toContain(second.name);
    await filter(0, ""); await filter(1, "doctor");
    expect(text()).toContain(second.name); expect(text()).not.toContain(first.name);
  });
  test("load errors offer retry instead of a false empty state", async () => {
    getCustomersAPI.mockRejectedValueOnce(failure(500, "Catalog temporarily unavailable")); await render();
    expect(container.querySelector('[role="alert"]').textContent).toContain("Catalog temporarily unavailable");
    expect(text()).not.toContain("No customers found");
    await click(button(/^Retry$/)); expect(text()).toContain(first.name);
  });
  test("empty results have a usable empty state", async () => {
    current = []; await render(); expect(text()).toContain("No customers found"); expect(button(/^Add Customer$/)).toBeTruthy();
  });
  test("focus refreshes customers added elsewhere", async () => {
    await render(); current = [...current, { ...first, customerId: "CUST010", name: "Added by Admin" }];
    await act(async () => window.dispatchEvent(new Event("focus"))); await flush();
    expect(text()).toContain("Added by Admin");
  });
  test("permission denial removes previously displayed list data", async () => {
    await render(); getCustomersAPI.mockRejectedValueOnce(failure(403, "Forbidden"));
    await click(button(/^Refresh$/)); expect(text()).not.toContain(first.name); expect(text()).toContain("permission to view customers");
  });
  test("creation has accessible fields and no arbitrary creator chooser", async () => {
    await render(); await click(button(/^Add Customer$/));
    for (const name of ["name", "address", "contact", "gst", "email"]) {
      const node = container.querySelector(`[name="${name}"]`);
      expect(container.querySelector(`label[for="${node.id}"]`)).toBeTruthy();
    }
    expect(container.querySelector('[name="addedBy"]')).toBeNull(); expect(text()).not.toContain("connected Employee");
  });
  test("name is required while contact and tax fields remain optional", async () => {
    await render(); await click(button(/^Add Customer$/)); await input("name", "   "); await click(button(/^Save$/));
    expect(text()).toContain("Customer name is required"); expect(createCustomerAPI).not.toHaveBeenCalled();
    await input("name", "  Name only customer  "); await click(button(/^Save$/));
    expect(createCustomerAPI).toHaveBeenCalledWith({ name: "Name only customer", address: "", contact: "", gst: "", email: "", status: "active", companyType: "dealer" }, expect.any(String));
    expect(text()).toContain("Name only customer"); expect(text()).not.toContain("Add New Customer");
  });
  test("invalid optional email is rejected without a request", async () => {
    await render(); await click(button(/^Add Customer$/)); await input("name", "New customer"); await input("email", "invalid-address"); await click(button(/^Save$/));
    expect(text()).toContain("Enter a valid email address"); expect(createCustomerAPI).not.toHaveBeenCalled();
  });
  test("server validation errors keep entered data and unchanged retries reuse their key", async () => {
    createCustomerAPI.mockRejectedValueOnce(failure(400, "Email already in use"));
    await render(); await click(button(/^Add Customer$/)); await input("name", "Retry customer"); await input("email", "existing@worknest.test");
    await click(button(/^Save$/)); expect(text()).toContain("Email already in use");
    expect(container.querySelector('[name="name"]').value).toBe("Retry customer");
    const key = createCustomerAPI.mock.calls[0][1];
    await click(button(/^Save$/)); expect(createCustomerAPI.mock.calls[1][1]).toBe(key);
  });
  test("changing a failed payload starts a fresh creation key", async () => {
    createCustomerAPI.mockRejectedValueOnce(failure(400, "Email already in use"));
    await render(); await click(button(/^Add Customer$/)); await input("name", "New customer"); await click(button(/^Save$/));
    const key = createCustomerAPI.mock.calls[0][1]; await input("name", "Changed customer"); await click(button(/^Save$/));
    expect(createCustomerAPI.mock.calls[1][1]).not.toBe(key);
  });
  test("pending creation blocks duplicate submit and disables its form", async () => {
    let complete;
    createCustomerAPI.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    await render(); await click(button(/^Add Customer$/)); await input("name", "One creation");
    await act(async () => {
      const form = container.querySelector("form");
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    }); await flush();
    expect(createCustomerAPI).toHaveBeenCalledTimes(1); expect(container.querySelector("fieldset").disabled).toBe(true);
    await act(async () => complete({ data: { customer: { customerId: "CUST003" } } })); await flush();
    expect(text()).not.toContain("Add New Customer");
  });
  test("Admin edits the existing customer using its business code and preserves legacy category", async () => {
    current[0].companyType = "hospital"; await render("/admin/customers", admin); await click(button(/^Edit Acquired Customer$/));
    expect(container.querySelector('[name="companyType"]').value).toBe("hospital");
    await input("name", "Admin updated name"); await click(button(/^Save$/));
    expect(updateCustomerAPI).toHaveBeenCalledWith("CUST001", expect.objectContaining({ name: "Admin updated name", companyType: "hospital" }));
    expect(updateCustomerAPI.mock.calls[0][1].addedBy).toBeUndefined(); expect(text()).toContain("Admin updated name");
  });
  test("Admin archive cancellation and success retain existing authorized behavior", async () => {
    const confirm = jest.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    await render("/admin/customers", admin); await click(button(/^Archive Acquired Customer$/)); expect(deleteCustomerAPI).not.toHaveBeenCalled();
    await click(button(/^Archive Acquired Customer$/)); expect(confirm).toHaveBeenCalledWith("Archive customer CUST001?");
    expect(deleteCustomerAPI).toHaveBeenCalledWith("CUST001"); expect(text()).not.toContain(first.name);
  });
  test("archive failure is visible and leaves the record displayed", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true); deleteCustomerAPI.mockRejectedValueOnce(failure(500, "Archive unavailable"));
    await render("/admin/customers", admin); await click(button(/^Archive Acquired Customer$/));
    expect(text()).toContain("Archive unavailable"); expect(text()).toContain(first.name);
  });
});

describe("Shared read-only Customer Details", () => {
  test("loads the business identifier and only renders safe display fields", async () => {
    current[0].addedBy.password = "sensitive-hash";
    await render("/employee/customers/CUST001"); expect(getCustomerAPI).toHaveBeenCalledWith("CUST001");
    for (const value of [first.name, first.customerId, first.address, first.gst, employee.name]) expect(text()).toContain(value);
    expect(text()).not.toContain("sensitive-hash"); expect(container.querySelector("input")).toBeNull();
    expect(button(/^Edit |^Archive /)).toBeUndefined(); expect(container.querySelector('a[href="/employee/customers"]')).toBeTruthy();
  });
  test("missing optional fields and invalid dates have no undefined or invalid display", async () => {
    current[0] = { customerId: "CUST001", name: "Minimal customer", createdAt: "invalid", addedBy: null };
    await render("/employee/customers/CUST001"); expect(text()).toContain("Minimal customer");
    expect(text()).not.toMatch(/undefined|Invalid Date/);
  });
  test("not-found and permission errors give an appropriate state", async () => {
    getCustomerAPI.mockRejectedValueOnce(failure(404, "Customer not found")); await render("/employee/customers/CUST001");
    expect(text()).toContain("Customer not found or archived"); expect(text()).not.toContain(first.name);
    getCustomerAPI.mockRejectedValueOnce(failure(403, "Forbidden")); await click(button(/^Retry$/));
    expect(text()).toContain("permission to view this customer");
  });
  test("a failed permission refresh removes the previous detail", async () => {
    await render("/employee/customers/CUST001"); getCustomerAPI.mockRejectedValueOnce(failure(404, "Archived"));
    await click(button(/^Refresh$/)); expect(text()).not.toContain(first.name); expect(text()).toContain("Customer not found or archived");
  });
  test("late detail results cannot replace a different route", async () => {
    let complete;
    getCustomerAPI.mockImplementationOnce(() => new Promise((resolve) => { complete = resolve; }));
    await render("/employee/customers/CUST001"); await act(async () => navigate("/employee/customers/CUST002")); await flush();
    expect(text()).toContain(second.name);
    await act(async () => complete({ data: first })); await flush(); expect(text()).toContain(second.name); expect(text()).not.toContain(first.name);
  });
  test("Admin details retain the Admin return path", async () => {
    await render("/admin/customers/CUST001", admin); expect(container.querySelector('a[href="/admin/customers"]')).toBeTruthy();
  });
});
