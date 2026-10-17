/* global jest, beforeEach, afterEach, describe, test, expect */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "../src/modules/auth/AuthContext";
import { getCurrentUserRequest } from "../src/modules/auth/services/auth.api";
import OrderManagement from "../src/modules/order/pages/OrderManagement";
import OrderDetails from "../src/modules/order/pages/OrderDetails";
import { getOrdersAPI, getOrderAPI, updateOrderStatusAPI, deleteOrderAPI, downloadOrderAPI } from "../src/modules/order/services/order.api";

jest.mock("../src/modules/auth/services/auth.api", () => ({ loginRequest: jest.fn(), getCurrentUserRequest: jest.fn() }));
jest.mock("../src/modules/order/services/order.api", () => ({ getOrdersAPI: jest.fn(), getOrderAPI: jest.fn(), updateOrderStatusAPI: jest.fn(), deleteOrderAPI: jest.fn(), downloadOrderAPI: jest.fn() }));
const admin = { _id: "admin-a", name: "Order Admin", email: "orders@worknest.test", role: "admin", status: "active", permissions: ["ORDER_READ", "ORDER_CREATE", "ORDER_UPDATE", "ORDER_ARCHIVE"] };
const original = {
  _id: "order-one", orderId: "ORD001", status: "confirm", allowedTransitions: ["dispatched", "cancelled"], sourceType: "quotation_conversion", quotationNumber: "QT-APPROVED-001",
  quotationId: { _id: "quote-one", quotationId: "QT-APPROVED-001" }, addedBy: { name: "Order Admin", empId: "EMP001" }, createdAt: "2026-10-17T12:00:00Z",
  customerSnapshot: { customerId: "CUS001", name: "Frozen customer", address: "Stored customer address", contact: "9876543210", gst: "GST-FROZEN", email: "customer@worknest.test", companyType: "Retailer" },
  productsSnapshot: [{ name: "Approved product snapshot", productId: "product-gone", sku: "OLD-SKU", description: "Agreed description", quantity: 2, price: 100, unitPrice: 100, discountPercentage: 10, discountAmount: 20, gstRate: 0, taxableAmount: 180, gstAmount: 0, lineTotal: 180 }],
  subtotal: 200, discountAmount: 20, taxableAmount: 180, gstAmount: 0, totalSnapshot: 180,
};
const failure = (status, message) => ({ response: { status, data: { message } } });
let container, root, current, navigate;
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const content = () => container.textContent;
const button = label => [...container.querySelectorAll("button")].find(node => label.test(node.textContent));
const click = async node => { expect(node).toBeTruthy(); await act(async () => node.click()); await flush(); };
const change = async (node, value) => {
  expect(node).toBeTruthy();
  const prototype = node.tagName === "SELECT" ? HTMLSelectElement.prototype : node.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(node, value);
    node.dispatchEvent(new Event(node.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  });
  await flush();
};
function Location() { navigate = useNavigate(); return <output data-path>{useLocation().pathname}</output>; }
async function render(path = "/admin/orders", user = admin) {
  getCurrentUserRequest.mockResolvedValue({ user });
  await act(async () => root.render(<AuthProvider><MemoryRouter initialEntries={[path]}><Location /><Routes>
    <Route path="/admin/orders" element={<OrderManagement />} />
    <Route path="/admin/orders/:orderId" element={<OrderDetails />} />
    <Route path="/admin/quotations/:quotationId" element={<p>Source quotation route</p>} />
  </Routes></MemoryRouter></AuthProvider>));
  await flush();
}
beforeEach(() => {
  localStorage.clear(); localStorage.setItem("token", "order-test-token");
  [getCurrentUserRequest, getOrdersAPI, getOrderAPI, updateOrderStatusAPI, deleteOrderAPI, downloadOrderAPI].forEach(mock => mock.mockReset());
  current = JSON.parse(JSON.stringify(original));
  getOrdersAPI.mockImplementation(async () => ({ data: current ? [current] : [] }));
  getOrderAPI.mockImplementation(async () => current ? { data: { order: current } } : Promise.reject(failure(404, "Order not found")));
  updateOrderStatusAPI.mockImplementation(async (_id, status) => {
    current = { ...current, status, allowedTransitions: status === "dispatched" ? ["delivered"] : [] };
    return { data: { order: current } };
  });
  deleteOrderAPI.mockImplementation(async () => { current = null; return { data: { message: "Order archived" } }; });
  downloadOrderAPI.mockResolvedValue({ data: new Blob(["snapshot document"]) });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks(); });

describe("Shared Admin Orders", () => {
  test("list displays customer, source, date, total and an existing preview with detail links", async () => {
    await render();
    for (const value of ["Order Management", "ORD001", "Frozen customer", "QT-APPROVED-001", "2026", "₹180.00", "Confirmed"]) expect(content()).toContain(value);
    expect(container.querySelector('a[href="/admin/orders/ORD001"]')).toBeTruthy();
    await click(button(/^ORD001$/)); expect(content()).toContain("Approved product snapshot");
    expect(button(/^Edit/)).toBeUndefined();
  });
  test("details render frozen commercial values and source quotation link", async () => {
    current.productsSnapshot[0].lineTotal = 171.23; current.totalSnapshot = 172.34;
    await render("/admin/orders/ORD001");
    for (const value of ["Order Details", "Stored customer address", "Agreed description", "OLD-SKU", "₹171.23", "₹172.34", "10%", "0%", "Order Admin"]) expect(content()).toContain(value);
    expect(container.querySelector('a[href="/admin/quotations/quote-one"]')).toBeTruthy();
    expect(container.querySelector("input,textarea")).toBeNull();
  });
  test("new fulfillment choices come only from backend allowedTransitions", async () => {
    current.allowedTransitions = ["delivered"];
    await render("/admin/orders/ORD001");
    expect([...container.querySelectorAll("option")].map(option => option.value)).toEqual(["", "delivered"]);
    await change(container.querySelector("select"), "delivered"); await click(button(/^Update status$/));
    expect(updateOrderStatusAPI).toHaveBeenCalledWith("ORD001", "delivered", "confirm", undefined);
    expect(content()).toContain("Delivered"); expect(content()).toContain("No further status changes");
  });
  test("list preview status action refetches full list and current preview", async () => {
    await render(); await click(button(/^ORD001$/));
    const reads = getOrdersAPI.mock.calls.length;
    await change(container.querySelector('[aria-label="Next order status"]'), "dispatched"); await click(button(/^Update status$/));
    expect(getOrdersAPI.mock.calls.length).toBeGreaterThan(reads);
    expect(content()).toContain("Dispatched"); expect(content()).toContain("Approved product snapshot");
    expect([...container.querySelector('[aria-label="Next order status"]').options].map(option => option.value)).toEqual(["", "delivered"]);
  });
  test("cancellation requires a reason and sends expected status", async () => {
    await render("/admin/orders/ORD001"); await change(container.querySelector("select"), "cancelled"); await click(button(/^Update status$/));
    expect(content()).toContain("A cancellation reason is required"); expect(updateOrderStatusAPI).not.toHaveBeenCalled();
    await change(container.querySelector("textarea"), "  Customer withdrew request  "); await click(button(/^Update status$/));
    expect(updateOrderStatusAPI).toHaveBeenCalledWith("ORD001", "cancelled", "confirm", "Customer withdrew request");
  });
  test("stale-status error refetches current persisted state", async () => {
    updateOrderStatusAPI.mockImplementationOnce(async () => {
      current = { ...current, status: "dispatched", allowedTransitions: ["delivered"] };
      throw failure(409, "Order changed; refresh and try again");
    });
    await render("/admin/orders/ORD001"); await change(container.querySelector("select"), "dispatched"); await click(button(/^Update status$/));
    expect(content()).toContain("Order changed; refresh and try again"); expect(content()).toContain("Dispatched");
    expect([...container.querySelector("select").options].map(option => option.value)).toEqual(["", "delivered"]);
  });
  test("pending status updates block duplicate submissions", async () => {
    let complete;
    updateOrderStatusAPI.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    await render("/admin/orders/ORD001"); await change(container.querySelector("select"), "dispatched");
    await click(button(/^Update status$/)); await click(button(/^Update status$/)); expect(updateOrderStatusAPI).toHaveBeenCalledTimes(1);
    current = { ...current, status: "dispatched", allowedTransitions: ["delivered"] };
    await act(async () => complete({ data: { order: current } })); await flush(); expect(content()).toContain("Dispatched");
  });
  test("legacy orders show absent components as unavailable without invented zero taxes", async () => {
    current = { ...current, sourceType: undefined, subtotal: undefined, discountAmount: undefined, taxableAmount: undefined, gstAmount: undefined, productsSnapshot: [{ name: "Legacy product", price: 100, quantity: 2 }], status: "old_custom_status", allowedTransitions: [] };
    await render("/admin/orders/ORD001");
    expect(content()).toContain("Historical pricing has not been recalculated"); expect(content()).toContain("Unavailable"); expect(content()).not.toContain("₹0.00");
    expect(content()).toContain("old_custom_status"); expect(container.querySelector("select")).toBeNull(); expect(button(/^Archive order$/)).toBeTruthy();
  });
  test("read-only Admin permissions hide status and archive controls", async () => {
    await render("/admin/orders/ORD001", { ...admin, permissions: ["ORDER_READ"] });
    expect(container.querySelector("select")).toBeNull(); expect(button(/^Archive order$/)).toBeUndefined(); expect(button(/^Download PDF$/)).toBeTruthy();
  });
  test("Employee cannot receive administrative controls even with cached Order permissions", async () => {
    await render("/admin/orders/ORD001", { ...admin, role: "employee" });
    expect(container.querySelector("select")).toBeNull(); expect(button(/^Archive order$|^Download PDF$/)).toBeUndefined();
  });
  test("list error is visible and retry does not show a misleading empty state", async () => {
    getOrdersAPI.mockRejectedValueOnce(failure(500, "Temporary order database error")); await render();
    expect(content()).toContain("Temporary order database error"); expect(content()).not.toContain("No orders found");
    await click(button(/^Retry$/)); expect(content()).toContain("Frozen customer");
  });
  test("empty list and search follow existing search conventions", async () => {
    await render(); await change(container.querySelector("input"), "nonexistent search"); expect(content()).toContain("No orders match your search");
    await change(container.querySelector("input"), "Frozen customer"); expect(content()).toContain("ORD001");
    await change(container.querySelector("input"), ""); current = null; await click(button(/^Refresh$/)); expect(content()).toContain("No orders found");
  });
  test("restricted detail refresh removes protected data and offers retry", async () => {
    await render("/admin/orders/ORD001"); getOrderAPI.mockRejectedValueOnce(failure(403, "Forbidden")); await click(button(/^Refresh$/));
    expect(content()).not.toContain("Approved product snapshot"); expect(content()).toContain("You do not have permission");
    await click(button(/^Retry$/)); expect(content()).toContain("Approved product snapshot");
  });
  test("temporary detail refresh error retains full saved snapshot", async () => {
    await render("/admin/orders/ORD001"); getOrderAPI.mockRejectedValueOnce(failure(500, "Temporary server error")); await click(button(/^Refresh$/));
    expect(content()).toContain("Temporary server error"); expect(content()).toContain("Approved product snapshot");
  });
  test("Admin can archive existing records and refetch reflects removal", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true); await render(); await click(button(/^ORD001$/)); await click(button(/^Archive order$/));
    expect(deleteOrderAPI).toHaveBeenCalledWith("ORD001"); expect(content()).toContain("No orders found"); expect(content()).not.toContain("Approved product snapshot");
  });
  test("archiving from details returns to the existing Orders list", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(true); await render("/admin/orders/ORD001"); await click(button(/^Archive order$/));
    expect(content()).toContain("Order Management"); expect(content()).toContain("No orders found"); expect(content()).not.toContain("Order not found");
  });
  test("download uses existing APIs and revokes its temporary object URL", async () => {
    window.URL.createObjectURL = jest.fn(() => "blob:order-test"); window.URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await render("/admin/orders/ORD001"); await click(button(/^Download PDF$/));
    expect(downloadOrderAPI).toHaveBeenCalledWith("ORD001", "pdf"); expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:order-test");
    await click(button(/^Download CSV$/)); expect(downloadOrderAPI).toHaveBeenCalledWith("ORD001", "csv");
  });
  test("focus refresh shows a status changed in another Admin session", async () => {
    await render("/admin/orders/ORD001"); current = { ...current, status: "delivered", allowedTransitions: ["closed"] };
    await act(async () => window.dispatchEvent(new Event("focus"))); await flush(); expect(content()).toContain("Delivered");
    expect([...container.querySelector("select").options].map(option => option.value)).toEqual(["", "closed"]);
  });
  test("switching detail routes cannot render a stale response", async () => {
    let finishOld;
    getOrderAPI.mockImplementation(id => id === "ORD001" ? new Promise(resolve => { finishOld = resolve; }) : Promise.resolve({ data: { order: { ...current, orderId: "ORD002", productsSnapshot: [] } } }));
    await render("/admin/orders/ORD001"); await act(async () => navigate("/admin/orders/ORD002")); await flush(); expect(content()).toContain("ORD002");
    await act(async () => finishOld({ data: { order: original } })); await flush(); expect(content()).not.toContain("Approved product snapshot"); expect(content()).toContain("ORD002");
  });
});
