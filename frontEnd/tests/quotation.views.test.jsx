/* global jest, beforeEach, afterEach, describe, test, expect */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "../src/modules/auth/AuthContext";
import { getCurrentUserRequest } from "../src/modules/auth/services/auth.api";
import QuotationManagement from "../src/modules/quotation/pages/QuotationManagement";
import QuotationDetails from "../src/modules/quotation/pages/quotationDetails/QuotationDetails";
import { fetchQuotationsAPI, fetchQuotationAPI, submitQuotationAPI, approveQuotationAPI, rejectQuotationAPI, reopenQuotationAPI, deleteQuotationAPI, convertQuotationAPI } from "../src/modules/quotation/services/quotation.api";

jest.mock("../src/modules/auth/services/auth.api", () => ({ loginRequest: jest.fn(), getCurrentUserRequest: jest.fn() }));
jest.mock("../src/modules/quotation/services/quotation.api", () => ({
  fetchQuotationsAPI: jest.fn(), fetchQuotationAPI: jest.fn(), submitQuotationAPI: jest.fn(),
  approveQuotationAPI: jest.fn(), rejectQuotationAPI: jest.fn(), reopenQuotationAPI: jest.fn(), deleteQuotationAPI: jest.fn(), convertQuotationAPI: jest.fn(),
}));
const employee = { _id: "employee-a", name: "Employee A", email: "quote-a@worknest.test", role: "employee", status: "active", permissions: ["QUOTATION_READ", "QUOTATION_CREATE", "QUOTATION_UPDATE", "QUOTATION_SUBMIT"] };
const admin = { ...employee, _id: "quotation-admin", name: "Quote Admin", role: "admin", permissions: [...employee.permissions, "QUOTATION_APPROVE", "QUOTATION_REJECT", "QUOTATION_ARCHIVE"] };
const original = {
  _id: "quotation-a", quotationId: "QT-PERSONAL-001", status: "DRAFT", employeeId: employee, createdBy: admin,
  customerId: { _id: "customer-one", name: "Existing customer", contact: "9000012345" },
  createdAt: "2026-05-03T12:00:00Z", validUntil: "2035-05-30T12:00:00Z", notes: "Keep the agreed historical snapshot.",
  subtotal: 100, discountAmount: 10, taxableAmount: 90, gstAmount: 0, grandTotal: 90,
  items: [{ _id: "item-one", productId: "product-one", productName: "Historical product", sku: "P-OLD", quantity: 1, unitPrice: 100, discountAmount: 10, discountPercentage: 10, taxableAmount: 90, gstRate: 0, gstAmount: 0, lineTotal: 90 }],
};
const failure = (status, message) => ({ response: { status, data: { message } } });
let root, container, current, navigate;
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const text = () => container.textContent;
const button = (label) => Array.from(container.querySelectorAll("button")).find(node => label.test(node.textContent) || label.test(node.getAttribute("aria-label") || ""));
const click = async node => { expect(node).toBeTruthy(); await act(async () => node.click()); await flush(); };
const changeSelect = async value => {
  const select = container.querySelector("select");
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await flush();
};
function Location() { navigate = useNavigate(); return <output data-path>{useLocation().pathname}</output>; }
async function render(path = "/employee/quotations", user = employee) {
  getCurrentUserRequest.mockResolvedValue({ user });
  await act(async () => root.render(<AuthProvider><MemoryRouter initialEntries={[path]}><Location /><Routes>
    <Route path="/employee/quotations" element={<QuotationManagement role="employee" />} />
    <Route path="/employee/quotations/:quotationId" element={<QuotationDetails role="employee" />} />
    <Route path="/employee/quotations/:quotationId/edit" element={<p>Shared edit route</p>} />
    <Route path="/employee/quotation" element={<p>Shared create route</p>} />
    <Route path="/admin/quotations" element={<QuotationManagement role="admin" />} />
    <Route path="/admin/quotations/:quotationId" element={<QuotationDetails role="admin" />} />
  </Routes></MemoryRouter></AuthProvider>));
  await flush();
}
beforeEach(() => {
  localStorage.clear(); localStorage.setItem("token", "quotation-view-token");
  for (const mock of [getCurrentUserRequest, fetchQuotationsAPI, fetchQuotationAPI, submitQuotationAPI, approveQuotationAPI, rejectQuotationAPI, reopenQuotationAPI, deleteQuotationAPI, convertQuotationAPI]) mock.mockReset();
  current = JSON.parse(JSON.stringify(original));
  fetchQuotationsAPI.mockImplementation(async ({ status } = {}) => {
    const quotations = !status || status === current.status ? [current] : [];
    return { data: { quotations, total: quotations.length, totalPages: 1 } };
  });
  fetchQuotationAPI.mockImplementation(async () => ({ data: { quotation: current } }));
  submitQuotationAPI.mockImplementation(async () => { current = { ...current, status: "SUBMITTED" }; return { data: { quotation: { _id: current._id, status: current.status } } }; });
  approveQuotationAPI.mockImplementation(async () => { current = { ...current, status: "APPROVED", approvedBy: admin, approvedAt: "2026-05-04T12:00:00Z" }; return { data: { quotation: { status: current.status } } }; });
  rejectQuotationAPI.mockImplementation(async (_id, reason) => { current = { ...current, status: "REJECTED", rejectionReason: reason, rejectedBy: admin, rejectedAt: "2026-05-04T12:00:00Z" }; return { data: { quotation: { status: current.status } } }; });
  reopenQuotationAPI.mockImplementation(async () => { current = { ...current, status: "DRAFT" }; return { data: { quotation: { status: current.status } } }; });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks(); });

describe("Shared quotation list", () => {
  test("Employee sees personal fields and existing creation route", async () => {
    await render();
    for (const value of ["My Quotations", "QT-PERSONAL-001", "Existing customer", "Quote Admin", "Draft", "₹90.00"]) expect(text()).toContain(value);
    expect(button(/^Approve$|^Reject$/)).toBeUndefined();
    await click(button(/New quotation/)); expect(text()).toContain("Shared create route");
  });
  test("Employee list uses existing details and edit deep links", async () => {
    await render(); await click(button(/^Edit$/)); expect(text()).toContain("Shared edit route");
    await act(async () => navigate("/employee/quotations")); await flush();
    await act(async () => container.querySelector("tbody tr").click()); await flush();
    expect(text()).toContain("Historical product"); expect(fetchQuotationAPI).toHaveBeenCalledWith(current._id);
  });
  test("submission refetches filtered membership and counts", async () => {
    await render(); await changeSelect("DRAFT"); await click(button(/^Submit$/));
    expect(submitQuotationAPI).toHaveBeenCalledWith(current._id);
    expect(fetchQuotationsAPI).toHaveBeenLastCalledWith(expect.objectContaining({ status: "DRAFT" }));
    expect(text()).toContain("No quotations found"); expect(text()).toContain("of 0 quotations");
  });
  test("list error offers retry rather than a misleading empty result", async () => {
    fetchQuotationsAPI.mockRejectedValueOnce(failure(500, "Database temporarily unavailable")); await render();
    expect(container.querySelector('[role="alert"]').textContent).toContain("Database temporarily unavailable");
    expect(text()).not.toContain("No quotations found"); await click(button(/^Retry$/)); expect(text()).toContain("Existing customer");
  });
  test("a mutation completing after a filter change refetches the current filter", async () => {
    let complete;
    submitQuotationAPI.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    await render(); await click(button(/^Submit$/)); await changeSelect("SUBMITTED");
    expect(text()).toContain("No quotations found");
    current = { ...current, status: "SUBMITTED" };
    await act(async () => complete({ data: { quotation: { status: "SUBMITTED" } } })); await flush();
    expect(fetchQuotationsAPI).toHaveBeenLastCalledWith(expect.objectContaining({ status: "SUBMITTED" }));
    expect(text()).toContain("Existing customer");
  });
  test("list refreshes on focus", async () => {
    await render(); const calls = fetchQuotationsAPI.mock.calls.length; current.status = "APPROVED";
    await act(async () => window.dispatchEvent(new Event("focus"))); await flush();
    expect(fetchQuotationsAPI.mock.calls.length).toBeGreaterThan(calls); expect(text()).toContain("Approved");
  });
  test("Admin retains review actions and canonical converted filter", async () => {
    current.status = "SUBMITTED"; await render("/admin/quotations", admin);
    expect(button(/^Approve$/)).toBeTruthy(); expect(button(/^Reject$/)).toBeTruthy();
    expect(Array.from(container.querySelectorAll("option")).some(option => option.value === "CONVERTED")).toBe(true);
    expect(Array.from(container.querySelectorAll("option")).some(option => option.value === "EXPIRED")).toBe(false);
    await click(button(/^Approve$/)); expect(text()).toContain("Approved"); expect(text()).toContain("Existing customer");
  });
});

describe("Read-only quotation details and workflow actions", () => {
  test("details display authoritative stored header and line amounts, including zero GST", async () => {
    current.grandTotal = 86.79; current.items[0].lineTotal = 85.43; await render("/employee/quotations/quotation-a");
    for (const value of ["₹86.79", "₹85.43", "0%", "10%", "Quote Admin", "Quotation owner: Employee A"]) expect(text()).toContain(value);
    expect(container.querySelector("input,textarea,select")).toBeNull(); expect(button(/Download PDF|Convert to Order/)).toBeUndefined();
    expect(fetchQuotationsAPI).not.toHaveBeenCalled();
  });
  test("Employee submit refetches full details and locks ordinary actions", async () => {
    await render("/employee/quotations/quotation-a"); const reads = fetchQuotationAPI.mock.calls.length; await click(button(/Submit for Approval/));
    expect(submitQuotationAPI).toHaveBeenCalledTimes(1); expect(text()).toContain("Submitted"); expect(text()).toContain("Historical product");
    expect(button(/^Edit$|Submit for Approval|Approve|Reject/)).toBeUndefined(); expect(fetchQuotationAPI).toHaveBeenCalledTimes(reads + 1); expect(fetchQuotationsAPI).not.toHaveBeenCalled();
  });
  test("Employee submitted details never expose approval controls", async () => {
    current.status = "SUBMITTED"; await render("/employee/quotations/quotation-a"); expect(button(/^Approve$|^Reject$|^Edit$/)).toBeUndefined(); expect(approveQuotationAPI).not.toHaveBeenCalled();
  });
  test("action permission remains necessary even for an owner", async () => {
    await render("/employee/quotations/quotation-a", { ...employee, permissions: ["QUOTATION_READ"] }); expect(button(/^Edit$|Submit for Approval/)).toBeUndefined();
  });
  test("Admin approval refetches items and reviewer information", async () => {
    current.status = "SUBMITTED"; await render("/admin/quotations/quotation-a", admin); await click(button(/^Approve$/));
    for (const value of ["Approved", "Approval", "Quote Admin", "Historical product", "authorized Admin conversion"]) expect(text()).toContain(value);
    expect(button(/^Approve$|^Reject$/)).toBeUndefined();
  });
  test("rejection and reopen label retained data as most recent rejection", async () => {
    current.status = "SUBMITTED"; jest.spyOn(window, "prompt").mockReturnValue("  Confirm agreed pricing  "); await render("/admin/quotations/quotation-a", admin);
    await click(button(/^Reject$/)); expect(rejectQuotationAPI).toHaveBeenCalledWith(current._id, "Confirm agreed pricing"); expect(text()).toContain("Confirm agreed pricing");
    await click(button(/Reopen draft/)); expect(text()).toContain("Most recent rejection"); expect(text()).toContain("Confirm agreed pricing"); expect(button(/Submit for Approval/)).toBeTruthy();
  });
  test("blank rejection fails inline without calling an API", async () => {
    current.status = "SUBMITTED"; jest.spyOn(window, "prompt").mockReturnValue("   "); await render("/admin/quotations/quotation-a", admin); await click(button(/^Reject$/));
    expect(text()).toContain("A rejection reason is required"); expect(rejectQuotationAPI).not.toHaveBeenCalled();
  });
  test("rejected owner can edit/reopen but converted quotations remain read-only", async () => {
    current = { ...current, status: "REJECTED", rejectionReason: "Add the requested item" }; await render("/employee/quotations/quotation-a");
    expect(button(/^Edit$/)).toBeTruthy(); expect(button(/Reopen draft/)).toBeTruthy(); expect(button(/Submit for Approval/)).toBeUndefined();
    current = { ...current, status: "CONVERTED" }; await click(button(/^Refresh$/)); expect(button(/^Edit$|Reopen draft|Submit for Approval/)).toBeUndefined(); expect(text()).toContain("Converted quotations are read-only");
  });
  test.each([403, 404])("restricted/missing detail (%s) removes stale protected contents", async status => {
    await render("/employee/quotations/quotation-a"); fetchQuotationAPI.mockRejectedValueOnce(failure(status, "Restricted quotation")); await click(button(/^Refresh$/));
    expect(container.querySelector('[role="alert"]')).toBeTruthy(); expect(text()).not.toContain("Historical product"); expect(button(/Submit for Approval/)).toBeUndefined();
    await click(button(/^Retry$/)); expect(text()).toContain("Historical product");
  });
  test("temporary refresh error preserves complete last details with retry", async () => {
    await render("/employee/quotations/quotation-a"); fetchQuotationAPI.mockRejectedValueOnce(failure(500, "Please retry the server request")); await click(button(/^Refresh$/));
    expect(text()).toContain("Please retry the server request"); expect(text()).toContain("Historical product"); await click(button(/^Retry$/)); expect(container.querySelector('[role="alert"]')).toBeNull();
  });
  test("access lost during an action removes details without leaving retry disabled", async () => {
    await render("/employee/quotations/quotation-a");
    submitQuotationAPI.mockRejectedValueOnce(failure(404, "Quotation not found"));
    fetchQuotationAPI.mockRejectedValueOnce(failure(404, "Quotation not found"));
    await click(button(/Submit for Approval/));
    expect(text()).toContain("Quotation not found");
    expect(text()).not.toContain("Historical product");
    expect(button(/^Retry$/).disabled).toBe(false);
    await click(button(/^Retry$/)); expect(text()).toContain("Historical product");
  });
  test("another owner's returned record does not expose contents or controls", async () => {
    current.employeeId = { ...employee, _id: "employee-b" }; await render("/employee/quotations/quotation-a");
    expect(text()).toContain("Quotation not found"); expect(text()).not.toContain("Historical product"); expect(button(/Submit for Approval|^Edit$/)).toBeUndefined();
  });
  test("missing legacy creator is not labelled as owner or raw ID", async () => {
    current.createdBy = "raw-creator-id"; await render("/employee/quotations/quotation-a"); expect(text()).toContain("Created ByUnavailable"); expect(text()).toContain("Quotation owner: Employee A"); expect(text()).not.toContain("raw-creator-id");
  });
  test("pending mutation blocks duplicate clicks and keeps full details", async () => {
    let complete; submitQuotationAPI.mockImplementation(() => new Promise(resolve => { complete = resolve; })); await render("/employee/quotations/quotation-a"); await click(button(/Submit for Approval/)); await click(button(/Updating/));
    expect(submitQuotationAPI).toHaveBeenCalledTimes(1); expect(text()).toContain("Historical product"); current = { ...current, status: "SUBMITTED" };
    await act(async () => complete({ data: { quotation: { status: "SUBMITTED" } } })); await flush(); expect(text()).toContain("Submitted");
  });
  test("navigating between IDs discards an earlier pending response", async () => {
    let resolveOld; fetchQuotationAPI.mockImplementation(id => id === "quotation-a" ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve({ data: { quotation: { ...current, _id: id, quotationId: "QT-SECOND", items: [] } } }));
    await render("/employee/quotations/quotation-a"); await act(async () => navigate("/employee/quotations/quotation-b")); await flush(); expect(text()).toContain("QT-SECOND");
    await act(async () => resolveOld({ data: { quotation: original } })); await flush(); expect(text()).toContain("QT-SECOND"); expect(text()).not.toContain("QT-PERSONAL-001"); expect(text()).not.toContain("Historical product");
  });
  test.each([
    ["Employee with cached grant", "/employee/quotations/quotation-a", { ...employee, permissions: [...employee.permissions, "ORDER_CREATE"] }, false],
    ["Admin without grant", "/admin/quotations/quotation-a", admin, false],
    ["authorized Admin", "/admin/quotations/quotation-a", { ...admin, permissions: [...admin.permissions, "ORDER_CREATE", "ORDER_READ"] }, true],
  ])("conversion visibility for %s", async (_label, path, user, visible) => {
    current.status = "APPROVED";
    await render(path, user); expect(Boolean(button(/Convert to Order/))).toBe(visible);
  });
  test("conversion refetches protected quotation and exposes created Order link", async () => {
    current.status = "APPROVED";
    convertQuotationAPI.mockImplementation(async () => { current = { ...current, status: "CONVERTED" }; return { data: { order: { orderId: "ORD001" } } }; });
    await render("/admin/quotations/quotation-a", { ...admin, permissions: [...admin.permissions, "ORDER_CREATE", "ORDER_READ"] });
    await click(button(/Convert to Order/));
    expect(convertQuotationAPI).toHaveBeenCalledWith("quotation-a"); expect(text()).toContain("Converted quotations are read-only"); expect(text()).toContain("Historical product");
    expect(container.querySelector('a[href="/admin/orders/ORD001"]')).toBeTruthy(); expect(button(/Convert to Order/)).toBeUndefined();
  });
  test("pending conversion prevents duplicate clicks", async () => {
    current.status = "APPROVED"; let complete;
    convertQuotationAPI.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    await render("/admin/quotations/quotation-a", { ...admin, permissions: [...admin.permissions, "ORDER_CREATE"] });
    await click(button(/Convert to Order/)); await click(button(/Convert to Order/)); expect(convertQuotationAPI).toHaveBeenCalledTimes(1);
    current = { ...current, status: "CONVERTED" }; await act(async () => complete({ data: { order: { orderId: "ORD001" } } })); await flush();
    expect(text()).toContain("Converted quotations are read-only");
  });
  test("failed conversion retains saved quotation and reports server error", async () => {
    current.status = "APPROVED"; convertQuotationAPI.mockRejectedValueOnce(failure(500, "Conversion rolled back"));
    await render("/admin/quotations/quotation-a", { ...admin, permissions: [...admin.permissions, "ORDER_CREATE"] }); await click(button(/Convert to Order/));
    expect(text()).toContain("Conversion rolled back"); expect(text()).toContain("Historical product"); expect(button(/Convert to Order/)).toBeTruthy();
  });
});
