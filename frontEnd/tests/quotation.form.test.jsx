/* global jest, beforeEach, afterEach, test, expect, require */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import AddQuotation from "../src/modules/quotation/pages/addQuotation/AddQuotation";
import { useAuth } from "../src/modules/auth/useAuth";
import api from "../src/api/axios";
import { createQuotationAPI, updateQuotationAPI, fetchQuotationAPI, submitQuotationAPI, reopenQuotationAPI } from "../src/modules/quotation/services/quotation.api";

jest.mock("../src/modules/auth/useAuth", () => ({ useAuth: jest.fn() }));
jest.mock("../src/api/axios", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("../src/modules/quotation/services/quotation.api", () => ({ createQuotationAPI: jest.fn(), updateQuotationAPI: jest.fn(), fetchQuotationAPI: jest.fn(), submitQuotationAPI: jest.fn(), reopenQuotationAPI: jest.fn() }));
const { normalizeItemPricing } = require("../../backEnd/src/modules/quotation/quotation.pricing");
const employee = { _id: "employee-a", name: "Employee A", role: "employee", permissions: ["QUOTATION_READ", "QUOTATION_CREATE", "QUOTATION_UPDATE", "QUOTATION_SUBMIT"] };
const admin = { _id: "admin", name: "Admin", role: "admin", permissions: [...employee.permissions, "EMPLOYEE_READ"] };
const customer = { _id: "customer", name: "Existing customer", status: "active", contact: "1234567890", address: "Customer address" };
const product = { _id: "product", productId: "PRD-01", name: "Current catalog name", price: 125, status: "active" };
const original = { _id: "quotation-a", quotationId: "QT0101", status: "DRAFT", customerId: customer, employeeId: employee,
  validUntil: "2035-06-01T00:00:00.000Z", notes: "Existing terms", items: [{ _id: "line-a", productId: product, productName: "Historical quoted name", sku: "OLD-SKU", description: "Quoted description", quantity: 2, unitPrice: 100, discountAmount: 5, discountPercentage: 0, gstRate: 0, taxableAmount: 195, gstAmount: 0, lineTotal: 195 }] };
const httpError = (status, message) => ({ response: { status, data: { message } } });
let root, container, current;
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const text = () => container.textContent;
const button = pattern => [...container.querySelectorAll("button")].find(node => pattern.test(node.textContent) || pattern.test(node.getAttribute("aria-label") || ""));
const click = async node => { expect(node).toBeTruthy(); await act(async () => { node.click(); }); await flush(); };
const change = async (selector, value) => {
  const input = container.querySelector(selector); expect(input).toBeTruthy();
  await act(async () => {
    const prototype = input.tagName === "SELECT" ? HTMLSelectElement.prototype : input.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event(input.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  });
};
const focus = async selector => { await act(async () => { container.querySelector(selector).focus(); }); };
function Location() { return <output data-current-path>{useLocation().pathname}</output>; }
function SwitchForm() { const navigate = useNavigate(); return <button onClick={() => navigate("/employee/quotations/quotation-b/edit")}>Switch quotation</button>; }
async function render(path = "/employee/quotation", user = employee, extra = null) {
  useAuth.mockReturnValue({ user });
  await act(async () => root.render(<MemoryRouter initialEntries={[path]}><Location />{extra}<Routes>
    <Route path="/employee/quotation" element={<AddQuotation role="employee" />} />
    <Route path="/employee/quotations/:quotationId/edit" element={<AddQuotation role="employee" />} />
    <Route path="/employee/quotations" element={<p>Quotation list destination</p>} />
    <Route path="/employee/quotations/:quotationId" element={<p>Quotation details destination</p>} />
    <Route path="/admin/quotations/:quotationId/edit" element={<AddQuotation role="admin" />} />
    <Route path="/admin/quotations/:quotationId" element={<p>Admin details destination</p>} />
  </Routes></MemoryRouter>));
  await flush();
}
async function fillNew() {
  await focus('input[placeholder="Search customers..."]'); await click(button(/Existing customer/));
  await focus('input[placeholder="Search products..."]'); await click(button(/Current catalog name/));
  await change('input[aria-label="Valid Until"]', "2035-06-01");
}
beforeEach(() => {
  current = { ...original, items: original.items.map(item => ({ ...item })) };
  for (const mock of [api.get, createQuotationAPI, updateQuotationAPI, fetchQuotationAPI, submitQuotationAPI, reopenQuotationAPI]) mock.mockReset();
  api.get.mockImplementation(async url => ({ data: url === "/api/customers" ? [customer] : url === "/api/products" ? [product] : [employee] }));
  fetchQuotationAPI.mockImplementation(async () => ({ data: { quotation: current } }));
  createQuotationAPI.mockImplementation(async payload => { current = { ...current, ...payload, items: payload.items.map(item => ({ ...item, ...normalizeItemPricing(item) })), _id: "quotation-new", quotationId: "QT0102", status: "DRAFT" }; return { data: { quotation: current } }; });
  updateQuotationAPI.mockImplementation(async (id, payload) => { current = { ...current, ...payload, items: payload.items.map(item => ({ ...item, ...normalizeItemPricing(item) })), _id: id }; return { data: { quotation: current } }; });
  reopenQuotationAPI.mockResolvedValue({ data: { quotation: { ...original, status: "DRAFT" } } });
  submitQuotationAPI.mockResolvedValue({ data: { quotation: { ...original, status: "SUBMITTED" } } });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

test("Employee creation loads shared catalogs once without requesting the Admin directory or editable customer controls", async () => {
  await render(); expect(api.get.mock.calls.map(call => call[0]).sort()).toEqual(["/api/customers", "/api/products"]);
  await fillNew(); expect(text()).toContain(customer.contact); expect(text()).toContain(customer.address);
  expect(button(/^Edit$/)).toBeUndefined(); expect(container.querySelector('input[placeholder="Enter contact number"]')).toBeNull();
});
test.each([["/api/products", "Product", "Search products..."], ["/api/customers", "Customer", "Search customers..."]])("%s failure provides an independent working retry", async (url, label, placeholder) => {
  api.get.mockImplementation(async path => { if (path === url) throw httpError(500, `${label} catalog unavailable`); return { data: path === "/api/customers" ? [customer] : [product] }; });
  await render(); expect(text()).toContain(`${label} catalog unavailable`);
  api.get.mockResolvedValueOnce({ data: url === "/api/customers" ? [customer] : [product] });
  await click(button(/^Retry$/)); expect(container.querySelector(`input[placeholder="${placeholder}"]`)).toBeTruthy();
});
test("draft creation sends explicit commercial values without client ownership or discarded inline customer edits", async () => {
  await render(); await fillNew(); await change('input[aria-label="GST for Current catalog name"]', "0"); await change('textarea[aria-label="Additional notes"]', "Delivery terms");
  await click(button(/^Save as Draft$/)); expect(createQuotationAPI).toHaveBeenCalledWith(expect.objectContaining({ customerId: customer._id, notes: "Delivery terms", validUntil: "2035-06-01", items: [expect.objectContaining({ productId: product._id, quantity: 1, unitPrice: 125, gstRate: "0" })] }));
  for (const field of ["employeeId", "createdBy", "updatedBy", "customerDetails", "status", "grandTotal"]) expect(createQuotationAPI.mock.calls[0][0]).not.toHaveProperty(field);
  expect(submitQuotationAPI).not.toHaveBeenCalled(); expect(text()).toContain("Quotation list destination");
});
test("selected products cannot create unintended duplicate rows", async () => {
  await render(); await fillNew(); expect(text()).toContain("All products have been added"); expect(container.querySelector('input[placeholder="Search products..."]')).toBeNull();
});
test("editing prefills stored snapshots, commercial fields and identity rather than current Product values", async () => {
  await render("/employee/quotations/quotation-a/edit"); expect(text()).toContain("Historical quoted name");
  expect(container.querySelector('input[aria-label="Unit price for Historical quoted name"]').value).toBe("100");
  expect(container.querySelector('input[aria-label="GST for Historical quoted name"]').value).toBe("0");
  expect(container.querySelector('input[aria-label="Valid Until"]').value).toBe("2035-06-01");
  await change('textarea[aria-label="Additional notes"]', "Revised terms"); await click(button(/^Save as Draft$/));
  expect(createQuotationAPI).not.toHaveBeenCalled(); expect(updateQuotationAPI).toHaveBeenCalledWith(original._id, expect.objectContaining({ items: [expect.objectContaining({ _id: "line-a", productId: product._id, productName: "Historical quoted name", unitPrice: 100, discountAmount: 5, gstRate: 0 })] }));
});
test.each(["SUBMITTED", "APPROVED", "CONVERTED"])("direct %s editing is blocked before editable controls render", async status => {
  current.status = status; await render("/employee/quotations/quotation-a/edit"); expect(text()).toContain("locked and cannot be edited");
  expect(container.querySelector("input, textarea")).toBeNull(); expect(button(/^Save as Draft$|Update & Submit/)).toBeUndefined();
});
test("navigating to an unavailable quotation removes stale data and exposes retry", async () => {
  await render("/employee/quotations/quotation-a/edit", employee, <SwitchForm />); fetchQuotationAPI.mockRejectedValueOnce(httpError(404, "Quotation not found"));
  await click(button(/^Switch quotation$/)); expect(text()).not.toContain("Historical quoted name"); expect(text()).toContain("Quotation not found"); expect(button(/^Save as Draft$/)).toBeUndefined();
  current = { ...current, _id: "quotation-b", quotationId: "QT0202", notes: "Second terms" }; await click(button(/^Retry$/));
  expect(text()).toContain("QT0202"); expect(container.querySelector('textarea[aria-label="Additional notes"]').value).toBe("Second terms");
});
test("a successful draft persists its identity after submit failure so retry updates instead of duplicating it", async () => {
  submitQuotationAPI.mockRejectedValueOnce(httpError(400, "Submission temporarily failed")); await render(); await fillNew(); await click(button(/^Save & Submit$/));
  expect(text()).toContain("Retry will update this draft"); await click(button(/^Update & Submit$/));
  expect(createQuotationAPI).toHaveBeenCalledTimes(1); expect(updateQuotationAPI).toHaveBeenCalledWith("quotation-new", expect.any(Object));
  expect(submitQuotationAPI.mock.calls).toEqual([["quotation-new"], ["quotation-new"]]); expect(text()).toContain("Quotation details destination");
});
test("pending saves block duplicate clicks", async () => {
  let resolve; createQuotationAPI.mockReturnValue(new Promise(done => { resolve = done; })); await render(); await fillNew(); await click(button(/^Save as Draft$/));
  const pending = button(/^Saving/); expect(pending.disabled).toBe(true); await click(pending); expect(createQuotationAPI).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ data: { quotation: { ...original, _id: "quotation-new" } } }));
});
test.each([["Quantity for Historical quoted name", "0", "positive integer"], ["Unit price for Historical quoted name", "-1", "non-negative"]])("invalid %s is rejected before saving", async (label, value, message) => {
  await render("/employee/quotations/quotation-a/edit"); await change(`input[aria-label="${label}"]`, value); await click(button(/^Save as Draft$/)); expect(text()).toContain(message); expect(updateQuotationAPI).not.toHaveBeenCalled();
});
test("Admin retains unchanged archived Customer and inactive owner when editing historical records", async () => {
  current = { ...current, customerId: { ...customer, deleted: true }, employeeId: { ...employee, status: "inactive" } }; api.get.mockImplementation(async url => ({ data: url === "/api/products" ? [product] : [] }));
  await render("/admin/quotations/quotation-a/edit", admin); expect(text()).toContain(customer.name); expect(text()).toContain(employee.name);
  await change('textarea[aria-label="Additional notes"]', "Historical note correction"); await click(button(/^Save as Draft$/));
  expect(updateQuotationAPI).toHaveBeenCalledWith(original._id, expect.objectContaining({ customerId: customer._id, employeeId: employee._id })); expect(text()).toContain("Admin details destination");
});
test("rejected revision preserves update → reopen → submit action order", async () => {
  current.status = "REJECTED"; await render("/employee/quotations/quotation-a/edit"); await click(button(/^Update & Submit$/));
  expect(updateQuotationAPI).toHaveBeenCalledWith(original._id, expect.any(Object)); expect(reopenQuotationAPI).toHaveBeenCalledWith(original._id); expect(submitQuotationAPI).toHaveBeenCalledWith(original._id);
  expect(updateQuotationAPI.mock.invocationCallOrder[0]).toBeLessThan(reopenQuotationAPI.mock.invocationCallOrder[0]); expect(reopenQuotationAPI.mock.invocationCallOrder[0]).toBeLessThan(submitQuotationAPI.mock.invocationCallOrder[0]);
});
test("missing submit permission retains draft save without exposing the submit action", async () => {
  await render(undefined, { ...employee, permissions: employee.permissions.filter(permission => permission !== "QUOTATION_SUBMIT") }); expect(button(/^Save as Draft$/)).toBeTruthy(); expect(button(/Save & Submit|Update & Submit/)).toBeUndefined();
});

test("a late save cannot replace or navigate away from a different quotation", async () => {
  let resolve;
  updateQuotationAPI.mockReturnValueOnce(new Promise(done => { resolve = done; }));
  await render("/employee/quotations/quotation-a/edit", employee, <SwitchForm />);
  await click(button(/^Save as Draft$/));
  current = { ...original, _id: "quotation-b", quotationId: "QT0202", notes: "Second quotation terms" };
  await click(button(/^Switch quotation$/));
  await act(async () => resolve({ data: { quotation: { ...original, notes: "Outdated response" } } }));
  expect(container.querySelector('[data-current-path]').textContent).toBe("/employee/quotations/quotation-b/edit");
  expect(text()).toContain("QT0202");
  expect(container.querySelector('textarea[aria-label="Additional notes"]').value).toBe("Second quotation terms");
});

test("missing update permission prevents an edit save independently of submit permission", async () => {
  await render("/employee/quotations/quotation-a/edit", { ...employee, permissions: ["QUOTATION_READ", "QUOTATION_SUBMIT"] });
  expect(button(/^Save as Draft$/).disabled).toBe(true);
  expect(button(/^Update & Submit$/).disabled).toBe(true);
  await click(button(/^Save as Draft$/));
  expect(updateQuotationAPI).not.toHaveBeenCalled();
});

test("blank pricing while typing shows an error and disables saving, then recovers when corrected", async () => {
  await render("/employee/quotations/quotation-a/edit");
  await change('input[aria-label="Unit price for Historical quoted name"]', "");
  expect(text()).toContain("Correct the item pricing");
  expect(button(/^Save as Draft$/).disabled).toBe(true);
  expect(updateQuotationAPI).not.toHaveBeenCalled();
  await change('input[aria-label="Unit price for Historical quoted name"]', "100");
  expect(text()).not.toContain("Correct the item pricing");
  expect(button(/^Save as Draft$/).disabled).toBe(false);
});

test("percentage discount and explicit zero GST use the shared exact preview and remain in the submitted draft", async () => {
  await render("/employee/quotations/quotation-a/edit");
  await change('select[aria-label="Discount type for Historical quoted name"]', "percentage");
  await change('input[aria-label="Discount percentage for Historical quoted name"]', "10");
  expect(text()).toContain("₹180.00");
  await click(button(/^Save as Draft$/));
  expect(updateQuotationAPI).toHaveBeenCalledWith(original._id, expect.objectContaining({ items: [expect.objectContaining({ discountPercentage: "10", discountAmount: 0, gstRate: 0 })] }));
});

test("each responsive discount control has one numeric field and percentage mode remains selected at zero", async () => {
  await render("/employee/quotations/quotation-a/edit");
  const discountInputs = () => [...container.querySelectorAll('input[aria-label^="Discount"]')];
  const discountTypes = () => [...container.querySelectorAll('select[aria-label="Discount type for Historical quoted name"]')];
  expect(discountTypes()).toHaveLength(2); // Both responsive views remain mounted.
  expect(discountInputs()).toHaveLength(2);
  expect(discountInputs().map(input => input.getAttribute("aria-label"))).toEqual(["Discount for Historical quoted name", "Discount for Historical quoted name"]);
  expect(discountTypes().map(select => select.value)).toEqual(["amount", "amount"]);

  await change('select[aria-label="Discount type for Historical quoted name"]', "percentage");
  expect(discountTypes().map(select => select.value)).toEqual(["percentage", "percentage"]);
  expect(discountInputs()).toHaveLength(2);
  expect(discountInputs().map(input => input.value)).toEqual(["0", "0"]);
  expect(discountInputs().every(input => input.getAttribute("aria-label") === "Discount percentage for Historical quoted name")).toBe(true);
  expect(text()).toContain("₹200.00");

  await change('input[aria-label="Discount percentage for Historical quoted name"]', "10");
  expect(discountInputs().map(input => input.value)).toEqual(["10", "10"]);
  expect(discountTypes().map(select => select.value)).toEqual(["percentage", "percentage"]);
  expect(text()).toContain("₹180.00");
});

test("switching from percentage to amount clears the inactive percentage and saves only the chosen discount", async () => {
  await render("/employee/quotations/quotation-a/edit");
  await change('select[aria-label="Discount type for Historical quoted name"]', "percentage");
  await change('input[aria-label="Discount percentage for Historical quoted name"]', "10");
  expect(text()).toContain("₹180.00");

  await change('select[aria-label="Discount type for Historical quoted name"]', "amount");
  expect(container.querySelector('input[aria-label="Discount percentage for Historical quoted name"]')).toBeNull();
  expect([...container.querySelectorAll('input[aria-label="Discount for Historical quoted name"]')].map(input => input.value)).toEqual(["0", "0"]);
  expect(text()).toContain("₹200.00");
  await change('input[aria-label="Discount for Historical quoted name"]', "25");
  expect(text()).toContain("₹175.00");
  await click(button(/^Save as Draft$/));
  expect(updateQuotationAPI).toHaveBeenCalledWith(original._id, expect.objectContaining({ items: [expect.objectContaining({ discountPercentage: 0, discountAmount: "25", gstRate: 0 })] }));
});

test("saved percentage discount selects its mode without changing historical pricing on a notes-only save", async () => {
  const historical = { ...original.items[0], quantity: 1, unitPrice: 0.05, discountAmount: 0.01,
    discountPercentage: 10, gstRate: 18, taxableAmount: 0.05, gstAmount: 0.01, lineTotal: 0.05 };
  current.items = [historical];
  await render("/employee/quotations/quotation-a/edit");
  expect([...container.querySelectorAll('select[aria-label="Discount type for Historical quoted name"]')].map(select => select.value)).toEqual(["percentage", "percentage"]);
  expect([...container.querySelectorAll('input[aria-label="Discount percentage for Historical quoted name"]')].map(input => input.value)).toEqual(["10", "10"]);
  expect(container.querySelector('input[aria-label="Discount for Historical quoted name"]')).toBeNull();
  expect(text()).toContain("₹0.06");
  await change('textarea[aria-label="Additional notes"]', "Updated delivery note");
  await click(button(/^Save as Draft$/));
  expect(updateQuotationAPI).toHaveBeenCalledWith(original._id, expect.objectContaining({ notes: "Updated delivery note", items: [{ ...historical, productId: product._id }] }));
});

test("clearing a saved percentage to zero retains percentage mode without applying its stored amount", async () => {
  current.items = [{ ...original.items[0], discountPercentage: 10, discountAmount: 20, taxableAmount: 180, lineTotal: 180 }];
  await render("/employee/quotations/quotation-a/edit");
  expect(text()).toContain("₹180.00");
  await change('input[aria-label="Discount percentage for Historical quoted name"]', "0");
  expect([...container.querySelectorAll('select[aria-label="Discount type for Historical quoted name"]')].map(select => select.value)).toEqual(["percentage", "percentage"]);
  expect([...container.querySelectorAll('input[aria-label="Discount percentage for Historical quoted name"]')].map(input => input.value)).toEqual(["0", "0"]);
  expect(container.querySelector('input[aria-label="Discount for Historical quoted name"]')).toBeNull();
  expect(text()).toContain("₹200.00");
  await click(button(/^Save as Draft$/));
  expect(updateQuotationAPI).toHaveBeenCalledWith(original._id, expect.objectContaining({ items: [expect.objectContaining({ discountPercentage: "0", discountAmount: 0, gstRate: 0 })] }));
});

test("an unchanged legacy line shows its saved totals until the Employee changes a commercial input", async () => {
  current.items = [{ ...original.items[0], quantity: 1, unitPrice: 0.05, discountAmount: 0.01,
    discountPercentage: 10, gstRate: 18, taxableAmount: 0.05, gstAmount: 0.01, lineTotal: 0.05 }];
  await render("/employee/quotations/quotation-a/edit");
  expect(text()).toContain("₹0.05");
  expect(text()).toContain("₹0.06");
  await change('input[aria-label="Quantity for Historical quoted name"]', "2");
  expect(text()).toContain("₹0.11");
  expect(text()).toContain("₹0.10");
  expect(text()).toContain("₹0.02");
});
