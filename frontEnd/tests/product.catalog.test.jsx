/* global jest, beforeEach, afterEach, describe, test, expect */
import { act } from "react";
import { createRoot } from "react-dom/client";
import { AuthContext } from "../src/modules/auth/auth.context";
import ProductManagement from "../src/modules/product/pages/ProductManagement";
import { getProductsAPI, createProductAPI, updateProductAPI, deleteProductAPI } from "../src/modules/product/services/product.api";
import { toast } from "react-toastify";

jest.mock("../src/modules/product/services/product.api", () => ({
  getProductsAPI: jest.fn(), createProductAPI: jest.fn(), updateProductAPI: jest.fn(), deleteProductAPI: jest.fn(),
}));
jest.mock("react-toastify", () => ({ toast: { warn: jest.fn(), error: jest.fn(), success: jest.fn() } }));
jest.mock("../src/api/axios", () => ({ __esModule: true, default: { defaults: { baseURL: "http://catalog.worknest.test" } } }));

const employee = { _id: "employee-a", role: "employee", permissions: ["PRODUCT_READ"] };
const admin = { _id: "admin-a", role: "admin", permissions: ["PRODUCT_READ", "PRODUCT_CREATE", "PRODUCT_UPDATE", "PRODUCT_ARCHIVE"] };
const product = { _id: "product-one", productId: "PRD001", name: "Catalog desk", description: "Oak workstation", price: 1250.5, image: "desk.webp" };
const second = { _id: "product-two", productId: "PRD002", name: "Catalog chair", description: "Adjustable seat", price: 250, image: "" };
const failure = (status, message) => ({ response: { status, data: { message } } });

let root, container, products;
const text = () => container.textContent;
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
const button = pattern => Array.from(container.querySelectorAll("button")).find(node => pattern.test(node.textContent));
const click = async node => { expect(node).toBeTruthy(); await act(async () => node.click()); await flush(); };
const change = async (selector, value) => {
  const input = container.querySelector(selector);
  expect(input).toBeTruthy();
  await act(async () => {
    const prototype = input.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await flush();
};
const render = async (user = employee) => {
  await act(async () => root.render(<AuthContext.Provider value={{ user, status: "authenticated" }}><ProductManagement /></AuthContext.Provider>));
  await flush();
};
const card = () => container.querySelector('[aria-label="Catalog desk details"]');

beforeEach(() => {
  for (const mock of [getProductsAPI, createProductAPI, updateProductAPI, deleteProductAPI]) mock.mockReset();
  products = [{ ...product }, { ...second }];
  getProductsAPI.mockImplementation(async () => ({ data: products }));
  createProductAPI.mockResolvedValue({ data: { message: "Product added successfully" } });
  updateProductAPI.mockResolvedValue({ data: { message: "Product updated successfully" } });
  deleteProductAPI.mockResolvedValue({ data: { message: "Product and image deleted successfully" } });
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });

describe("Shared Product catalog and management", () => {
  test("Employee reads existing product fields and images without mutation controls or invented tax fields", async () => {
    await render(); await click(card());
    for (const value of ["Product Catalog", "Catalog desk", "PRD001", "Oak workstation", "1250.5"]) expect(text()).toContain(value);
    expect(container.querySelector('img[alt="Catalog desk"]').getAttribute("src")).toContain("/uploads/desk.webp");
    expect(button(/^Add Product$|^Edit$|^Delete$/)).toBeUndefined();
    expect(text()).not.toMatch(/GST|undefined|Invalid Date/);
    expect(getProductsAPI).toHaveBeenCalledWith();
    for (const mutation of [createProductAPI, updateProductAPI, deleteProductAPI]) expect(mutation).not.toHaveBeenCalled();
  });
  test("stale elevated client permissions cannot expose Employee product management", async () => {
    await render({ ...employee, permissions: admin.permissions }); await click(card());
    expect(button(/^Add Product$|^Edit$|^Delete$/)).toBeUndefined();
  });
  test("missing or failed product images use a local placeholder without a broken fallback request", async () => {
    await render();
    expect(container.querySelector('[role="img"][aria-label="Catalog chair image unavailable"]')).toBeTruthy();
    expect(container.querySelector('img[src="/fallback.png"]')).toBeNull();
    await act(async () => container.querySelector('img[alt="Catalog desk"]').dispatchEvent(new Event("error")));
    expect(container.querySelector('img[alt="Catalog desk"]')).toBeNull();
    expect(container.querySelector('[role="img"][aria-label="Catalog desk image unavailable"]')).toBeTruthy();
  });
  test("Admin retains existing add, edit and delete controls", async () => {
    await render(admin); await click(card());
    expect(text()).toContain("Product Management");
    for (const label of [/^Add Product$/, /^Edit$/, /^Delete$/]) expect(button(label)).toBeTruthy();
  });
  test("Admin controls still require their corresponding permissions", async () => {
    await render({ ...admin, permissions: ["PRODUCT_READ", "PRODUCT_UPDATE"] }); await click(card());
    expect(button(/^Edit$/)).toBeTruthy(); expect(button(/^Add Product$|^Delete$/)).toBeUndefined();
  });
  test.each(["dEsK", "  prd001  ", "workstation"])("existing search matches name, code or description (%s)", async search => {
    await render(); await change('input[placeholder^="Search product"]', search);
    expect(card()).toBeTruthy(); expect(container.querySelector('[aria-label="Catalog chair details"]')).toBeNull();
  });
  test("search offers an explicit empty result and clearing it restores products", async () => {
    await render(); await change('input[placeholder^="Search product"]', "not available");
    expect(text()).toContain("No products match your search.");
    await change('input[placeholder^="Search product"]', ""); expect(card()).toBeTruthy();
  });
  test("an empty catalog is distinct from request failure", async () => {
    products = []; await render(); expect(text()).toContain("No products are available yet."); expect(container.querySelector('[role="alert"]')).toBeNull();
  });
  test("loading does not prematurely display an empty catalog", async () => {
    let resolve; getProductsAPI.mockImplementationOnce(() => new Promise(done => { resolve = done; })); await render();
    expect(button(/^Refreshing…$/).disabled).toBe(true); expect(text()).not.toContain("No products are available yet.");
    await act(async () => resolve({ data: products })); await flush(); expect(card()).toBeTruthy();
  });
  test("failed loading exposes inline retry and succeeds without obsolete APIs", async () => {
    getProductsAPI.mockRejectedValueOnce(failure(500, "Catalog temporarily unavailable")); await render();
    expect(container.querySelector('[role="alert"]').textContent).toContain("Catalog temporarily unavailable");
    expect(text()).not.toContain("No products are available yet.");
    await click(button(/^Retry$/)); expect(card()).toBeTruthy(); expect(container.querySelector('[role="alert"]')).toBeNull();
  });
  test("lost catalog permission clears previously loaded data", async () => {
    await render(); getProductsAPI.mockRejectedValueOnce(failure(403, "Forbidden")); await click(button(/^Refresh$/));
    expect(text()).toContain("You do not have permission to view products."); expect(card()).toBeNull();
  });
  test("manual and focus refresh display current catalog values", async () => {
    await render(); products = [{ ...product, price: 1500 }]; await click(button(/^Refresh$/)); expect(text()).toContain("1500");
    products = [{ ...product, name: "Updated desk" }];
    await act(async () => window.dispatchEvent(new Event("focus"))); await flush(); expect(text()).toContain("Updated desk");
  });
  test("an older catalog response cannot overwrite a newer refresh", async () => {
    let resolve; getProductsAPI.mockImplementationOnce(() => new Promise(done => { resolve = done; })); await render();
    products = [{ ...product, name: "Newest desk" }];
    await act(async () => window.dispatchEvent(new Event("focus"))); await flush();
    await act(async () => resolve({ data: [product] })); await flush();
    expect(text()).toContain("Newest desk"); expect(card()).toBeNull();
  });
  test("product details expand from the keyboard", async () => {
    await render(); expect(card().getAttribute("aria-expanded")).toBe("false");
    await act(async () => card().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    expect(card().getAttribute("aria-expanded")).toBe("true");
  });
  test("Admin edits existing product through the shared form and refreshes", async () => {
    await render(admin); await click(card()); await click(button(/^Edit$/));
    expect(container.querySelector('input[name="name"]').value).toBe(product.name);
    await change('input[name="price"]', "0"); await click(button(/^Save$/));
    expect(updateProductAPI).toHaveBeenCalledTimes(1);
    const [id, form] = updateProductAPI.mock.calls[0]; expect(id).toBe(product.productId); expect(form.get("price")).toBe("0");
    expect(form.has("image")).toBe(false); expect(getProductsAPI).toHaveBeenCalledTimes(2);
    expect(button(/^Add Product$/)).toBeTruthy();
  });
  test("failed Admin save keeps the form and displays a retryable error", async () => {
    createProductAPI.mockRejectedValueOnce(failure(400, "Product price is invalid")); await render(admin); await click(button(/^Add Product$/));
    await change('input[name="name"]', "New desk"); await change('textarea[name="description"]', "New description"); await change('input[name="price"]', "123");
    await click(button(/^Save$/)); expect(container.querySelector('[role="alert"]').textContent).toContain("Product price is invalid");
    expect(container.querySelector('input[name="name"]').value).toBe("New desk");
    await click(button(/^Save$/)); expect(createProductAPI).toHaveBeenCalledTimes(2); expect(button(/^Add Product$/)).toBeTruthy();
  });
  test("pending Admin creation blocks repeated submissions", async () => {
    let resolve; createProductAPI.mockImplementationOnce(() => new Promise(done => { resolve = done; })); await render(admin); await click(button(/^Add Product$/));
    await change('input[name="name"]', "New desk"); await change('textarea[name="description"]', "New description"); await change('input[name="price"]', "123");
    await click(button(/^Save$/)); await click(button(/^Save$/)); expect(createProductAPI).toHaveBeenCalledTimes(1);
    expect(container.querySelector("fieldset").disabled).toBe(true);
    await act(async () => resolve({ data: { message: "Created" } })); await flush(); expect(button(/^Add Product$/)).toBeTruthy();
  });
  test("Admin deletion retains existing business-code API and refresh", async () => {
    await render(admin); await click(card()); await click(button(/^Delete$/));
    expect(deleteProductAPI).toHaveBeenCalledWith(product.productId); expect(getProductsAPI).toHaveBeenCalledTimes(2); expect(toast.success).toHaveBeenCalledWith("Product deleted successfully");
  });
});
