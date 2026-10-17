// Run against the disposable development fixture described in tests/README.md.
// Node 22+ provides fetch/WebSocket; no browser-automation dependency is needed.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");

const settings = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const results = { checks: [], knownFailures: [], exceptions: [], secretFindings: [] };
const requests = [];
const pending = new Map();
const inspectBodies = new Set();
const bodyChecks = new Set();
const backendRequests = new Map();
const legacyImageRequests = [];
let browser;
let socket;
let sequence = 0;
let stage = "startup";
let promptResponse;

const safeMessage = (value) => String(value || "")
  .replaceAll(settings.password, "[PASSWORD REDACTED]")
  .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[JWT REDACTED]")
  .replace(/\$2[aby]\$\d\d\$[A-Za-z0-9./]+/g, "[HASH REDACTED]")
  .slice(0, 500);

function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 12000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(safeMessage(response.exceptionDetails.exception?.description || response.exceptionDetails.text));
  return response.result.value;
}

async function until(predicate, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await predicate()) return;
    await delay(80);
  }
  throw new Error("Timed out waiting for browser state");
}

function secretPaths(value, prefix = "") {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, entry]) => {
    const location = prefix ? `${prefix}.${key}` : key;
    return /^(password|passwordHash|password_hash|refreshToken|refresh_token|secret|jwtSecret)$/i.test(key)
      ? [location] : secretPaths(entry, location);
  });
}

async function state() {
  return evaluate(`(() => ({
    path: location.pathname, text: document.body.innerText,
    tokenPresent: !!localStorage.getItem('token'),
    userPresent: !!localStorage.getItem('user'),
    renderedHash: /\\$2[aby]\\$[0-9]{2}\\$/.test(document.body.innerText),
    nav: [...document.querySelectorAll('nav a')].map(a => ({path:a.getAttribute('href'),active:a.getAttribute('aria-current')}))
  }))()`);
}

async function navigate(route, expectedText) {
  await cdp("Page.navigate", { url: new URL(route, settings.frontendUrl).href });
  await until(async () => { const view = await state(); return view.path === route && (!expectedText || view.text.includes(expectedText)); });
  // Let requests initiated by mounted pages settle before inspecting errors.
  await delay(250);
  return state();
}

async function check(name, action, { allowDashboardFailure = false, expectedAuthStatus } = {}) {
  stage = name;
  const firstRequest = requests.length;
  const firstException = results.exceptions.length;
  try {
    await action();
    await delay(100);
    const failures = requests.slice(firstRequest).filter((entry) => entry.status >= 400 || entry.failed);
    if (allowDashboardFailure) {
      for (const entry of failures) {
        assert.equal(entry.path, "/api/dashboard/dashboard-metrics");
        assert.equal(entry.status, 500);
        results.knownFailures.push({ name, ...entry });
      }
    } else if (expectedAuthStatus) {
      assert.ok(failures.length > 0, "Expected denied authentication request");
      assert.ok(failures.every((entry) => entry.status === expectedAuthStatus));
    } else {
      assert.deepEqual(failures, [], "Unexpected API failure");
    }
    assert.equal(results.exceptions.length, firstException, "Browser JavaScript exception");
    results.checks.push({ name, passed: true });
  } catch (error) {
    results.checks.push({ name, passed: false, error: safeMessage(error.message) });
  }
}

async function login(email, role) {
  await navigate("/", "Welcome Back");
  await evaluate("document.querySelector('#email').focus()");
  await cdp("Input.insertText", { text: email });
  await evaluate("document.querySelector('#password').focus()");
  await cdp("Input.insertText", { text: settings.password });
  await evaluate("document.querySelector('button[type=submit]').click()");
  await until(async () => (await state()).path === `/${role}/dashboard`);
  await until(async () => (await state()).nav.length > 0);
  assert.equal((await state()).tokenPresent, true);
}

async function logout() {
  assert.equal(await evaluate(`(() => { const button=[...document.querySelectorAll('button')].find(b=>/log\\s*out/i.test(b.innerText)||/log\\s*out/i.test(b.getAttribute('aria-label')||'')); if(!button)return false; button.click();return true; })()`), true);
  await until(async () => (await state()).path === "/");
  const view = await state();
  assert.equal(view.tokenPresent, false);
  assert.equal(view.userPresent, false);
}

async function clickButton(label, taskId) {
  assert.equal(await evaluate(`(() => {
    const scope = ${taskId ? `document.querySelector('[data-task-id="${taskId}"]')` : "document"};
    const button = scope && [...scope.querySelectorAll('button')].find(node => node.innerText.trim() === ${JSON.stringify(label)});
    if (!button || button.disabled) return false;
    button.click(); return true;
  })()`), true, `Missing enabled ${label} control`);
}

async function fillInput(selector, value) {
  await until(() => evaluate(`!!document.querySelector(${JSON.stringify(selector)})`));
  await evaluate(`(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) throw new Error('Missing form field');
    const prototype = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
}

async function selectEmployee(name, identifier) {
  await fillInput('#assignedTo', name);
  await until(() => evaluate(`(() => {
    const option = [...document.querySelectorAll('li')].find(node => node.innerText.trim() === ${JSON.stringify(`${name} (${identifier})`)});
    if (!option) return false;
    (option.querySelector('button') || option).click(); return true;
  })()`));
}

async function taskWorkflow() {
  const title = `Browser integrated task ${Date.now()}`;
  const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  let taskId;
  await check("Admin logs in for Task workflow", () => login(settings.adminEmail, "admin"), { allowDashboardFailure: true });
  await check("Admin creates and assigns a Task through existing UI", async () => {
    await navigate("/admin/tasks", "Task Management");
    await clickButton("Add Task");
    await until(async () => (await state()).text.includes("Add New Task"));
    await selectEmployee(settings.employeeName, settings.employeeIdentifier);
    await fillInput('input[name="title"]', title);
    await fillInput('textarea[name="description"]', "Created and reassigned through the Admin UI for the disposable integration smoke test.");
    await fillInput('input[name="dueDate"]', dueDate);
    await clickButton("Save");
    await until(async () => { const view = await state(); return view.text.includes(title) && !view.text.includes("Add New Task"); });
    taskId = await evaluate(`import('/src/api/axios.js').then(({default:api}) => api.get('/api/tasks').then(response => response.data.find(task => task.title === ${JSON.stringify(title)})?.taskId))`);
    assert.ok(taskId, "Created Task was not persisted");
    await logout();
  });
  await check("Employee A sees the Admin-assigned Task in My Tasks", async () => {
    await login(settings.employeeEmail, "employee");
    assert.ok((await state()).nav.find(link => link.path === "/employee/tasks"));
    await navigate("/employee/tasks", title);
    assert.equal(await evaluate(`!!document.querySelector('[data-task-id="${taskId}"]')`), true);
    assert.doesNotMatch((await state()).text, /Delete|Add Task/);
    await clickButton("View task", taskId);
    await until(async () => { const view = await state(); return view.path === `/employee/tasks/${taskId}` && view.text.includes(title); });
    assert.ok((await state()).text.includes(settings.employeeName));
  });
  await check("Employee A starts the assigned Task", async () => {
    await clickButton("Start task");
    await until(async () => (await state()).text.includes("in-progress"));
    assert.ok((await state()).text.includes("Mark as done"));
  });
  await check("Employee A completes Task and list/detail agree after refetch", async () => {
    await clickButton("Mark as done");
    await until(async () => (await state()).text.includes("Completed tasks can only be reopened"));
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(node => /Start task|Mark as done/.test(node.innerText))"), false);
    const capture = await cdp("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(settings.tempDir, "employee-task-completed.png"), Buffer.from(capture.data, "base64"), { mode: 0o600 });
    await navigate("/employee/tasks", title);
    assert.equal(await evaluate(`document.querySelector('[data-task-id="${taskId}"]').innerText.includes('done')`), true);
    await logout();
  });
  await check("Admin sees Employee completion and reassigns through existing UI", async () => {
    await login(settings.adminEmail, "admin");
    await navigate("/admin/tasks", title);
    assert.equal(await evaluate(`document.querySelector('[data-task-id="${taskId}"]').innerText.includes('done')`), true);
    await clickButton("Edit", taskId);
    await until(async () => (await state()).text.includes("Edit Task"));
    assert.equal(await evaluate("document.querySelector('input[name=dueDate]').value"), dueDate);
    assert.ok((await evaluate("document.querySelector('#assignedTo').value")).includes(settings.employeeName));
    assert.equal(await evaluate("document.querySelector('select[name=status]').value"), "done");
    await selectEmployee(settings.employeeBName, settings.employeeBIdentifier);
    await clickButton("Save");
    await until(async () => { const view = await state(); return !view.text.includes("Edit Task") && view.text.includes(settings.employeeBName); });
    assert.equal(await evaluate(`document.querySelector('[data-task-id="${taskId}"]').innerText.includes('done')`), true);
    await logout();
  }, { allowDashboardFailure: true });
  await check("Employee A loses list access after Admin reassignment", async () => {
    await login(settings.employeeEmail, "employee");
    await navigate("/employee/tasks", "My Tasks");
    assert.equal(await evaluate(`!!document.querySelector('[data-task-id="${taskId}"]')`), false);
    assert.equal((await state()).text.includes(title), false);
  });
  await check("Employee A cannot open the reassigned Task deep link", async () => {
    await navigate(`/employee/tasks/${taskId}`, "Task not found");
    assert.equal((await state()).text.includes(title), false);
    await logout();
  }, { expectedAuthStatus: 404 });
  await check("Employee B gains access with the same completed status", async () => {
    await login(settings.employeeBEmail, "employee");
    await navigate("/employee/tasks", title);
    await clickButton("View task", taskId);
    await until(async () => (await state()).text.includes("Completed tasks can only be reopened"));
    assert.ok((await state()).text.includes(settings.employeeBName));
    const capture = await cdp("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(settings.tempDir, "reassigned-employee-task.png"), Buffer.from(capture.data, "base64"), { mode: 0o600 });
    await logout();
  });
  results.obsoleteOrRestrictedRequests = requests.filter(entry => entry.path.startsWith("/api/employee/") || (entry.stage.startsWith("Employee") && (entry.path.startsWith("/api/employees") || entry.path === "/api/dashboard/dashboard-metrics")));
  assert.deepEqual(results.obsoleteOrRestrictedRequests, []);
  await Promise.all(bodyChecks);
  assert.deepEqual(results.secretFindings, []);
}


async function selectCatalog(placeholder, name) {
  await fillInput(`input[placeholder="${placeholder}"]`, name);
  await until(() => evaluate(`(() => {
    const option = [...document.querySelectorAll('button')].find(node => node.querySelector('p')?.innerText.trim() === ${JSON.stringify(name)});
    if (!option || option.disabled) return false;
    option.click(); return true;
  })()`));
}

async function quotationInput(label, product, value) {
  if (label === 'Discount' || label === 'Discount percentage') {
    await evaluate(`(() => {
      const select = document.querySelector(${JSON.stringify(`select[aria-label="Discount type for ${product}"]`)});
      const mode = ${JSON.stringify(label === 'Discount percentage' ? 'percentage' : 'amount')};
      if (select.value !== mode) {
        select.value = mode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()`);
  }
  await fillInput(`input[aria-label="${label} for ${product}"]`, value);
}

async function verifyDiscountLayout() {
  results.discountLayout = [];
  for (const width of [1440, 390]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1100, deviceScaleFactor: 1, mobile: width < 1024 });
    if (width < 1024) await evaluate("document.querySelector('button[aria-label=\"Collapse navigation\"]')?.click()");
    await delay(350);
    const controls = await evaluate(`(() => {
      const selects = [...document.querySelectorAll('select[aria-label^="Discount type for "]')].filter(node => node.getClientRects().length);
      selects[0]?.scrollIntoView({block:'center'});
      return selects.map(select => ({mode:select.value, inputs:select.parentElement.querySelectorAll('input').length,
        height:select.parentElement.getBoundingClientRect().height,
        value:select.parentElement.querySelector('input').value}));
    })()`);
    assert.equal(controls.length, 2);
    assert.deepEqual(controls.map(control => control.mode), ['amount', 'percentage']);
    assert.deepEqual(controls.map(control => control.value), ['10', '10']);
    assert.ok(controls.every(control => control.inputs === 1 && control.height <= 42), 'Discount must remain a single compact control');
    results.discountLayout.push({width, controls});
    const capture = await cdp('Page.captureScreenshot', {format:'png'});
    fs.writeFileSync(path.join(settings.tempDir, `quotation-discount-${width}.png`), Buffer.from(capture.data,'base64'), {mode:0o600});
  }
  await cdp('Emulation.setDeviceMetricsOverride', {width:1440,height:1100,deviceScaleFactor:1,mobile:false});
  await evaluate("document.querySelector('button[aria-label=\"Expand navigation\"]')?.click()");
}

async function quotationRecord(id) {
  return evaluate(`import('/src/api/axios.js').then(({default:api}) => api.get('/api/quotations/${id}').then(response => response.data.quotation))`);
}

async function browserRequest(method, endpoint, data) {
  return evaluate(`import('/src/api/axios.js').then(({default:api}) => api.request({
    method:${JSON.stringify(method)}, url:${JSON.stringify(endpoint)}, data:${JSON.stringify(data)}
  }).then(response => ({status:response.status,data:response.data})).catch(error => ({status:error.response?.status,data:error.response?.data})))`);
}

async function clickCustomerAction(customerId, action) {
  assert.equal(await evaluate(`(() => {
    const row = [...document.querySelectorAll('tbody tr')].find(node => node.innerText.includes(${JSON.stringify(customerId)}));
    if (!row) return false;
    const buttons = [...row.querySelectorAll('button')];
    const pattern = new RegExp(${JSON.stringify(action)}, 'i');
    const button = buttons.find(node => pattern.test(node.innerText + ' ' + (node.getAttribute('aria-label') || '') + ' ' + (node.getAttribute('title') || ''))) || buttons[${action === "Edit" ? 0 : 1}];
    if (!button || button.disabled) return false;
    button.click(); return true;
  })()`), true, `Missing enabled Customer ${action} action`);
}

async function expandProduct(name) {
  await until(() => evaluate(`!![...document.querySelectorAll('[role="button"]')].find(node => node.getAttribute('aria-label') === ${JSON.stringify(`${name} details`)})`));
  assert.equal(await evaluate(`(() => {
    const card = [...document.querySelectorAll('[role="button"]')].find(node => node.getAttribute('aria-label') === ${JSON.stringify(`${name} details`)});
    if (!card) return false;
    card.click(); return true;
  })()`), true, 'Missing Product card');
}

async function catalogWorkflow() {
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  const catalogCheck = async (...args) => {
    await check(...args);
    if (!results.checks.at(-1).passed) throw new Error('Catalog browser workflow stopped at: ' + results.checks.at(-1).name);
  };
  const marker = `M3 acquired customer ${Date.now()}`;
  const adminCustomerName = `${marker} Admin regression`;
  const adminProductName = `M3 Admin product ${Date.now()}`;
  const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  let customer, quotationId, quotationNumber, adminCustomer, adminProduct, quotedProduct;

  await catalogCheck('Admin reviews existing Customer and Product management', async () => {
    await login(settings.adminEmail, 'admin');
    await navigate('/admin/customers', settings.customerName);
    assert.ok((await state()).text.includes('Add Customer'));
    await navigate('/admin/products', settings.productName);
    assert.ok((await state()).text.includes('Add Product'));
    await logout();
  }, { allowDashboardFailure: true });
  await catalogCheck('Employee opens shared Customers and creates a customer through the existing form', async () => {
    await login(settings.employeeEmail, 'employee');
    assert.deepEqual((await state()).nav.map(link => link.path), ['/employee/dashboard', '/employee/tasks', '/employee/customers', '/employee/products', '/employee/quotations', '/employee/profile']);
    await navigate('/employee/customers', settings.customerName);
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => /Edit|Archive|Delete/.test(button.innerText + ' ' + (button.getAttribute('aria-label') || '')))"), false);
    await clickButton('Add Customer');
    await until(async () => (await state()).text.includes('Add New Customer'));
    assert.equal(await evaluate("!!document.querySelector('#assignedTo,input[placeholder*=employee i]')"), false);
    await fillInput('#customer-name', marker);
    await fillInput('#customer-address', 'Disposable acquired customer address');
    await fillInput('#customer-contact', '9876543210');
    await fillInput('#customer-email', `m3-${Date.now()}@worknest-smoke.test`);
    await clickButton('Save');
    await until(async () => { const view = await state(); return view.text.includes(marker) && !view.text.includes('Add New Customer'); });
    const response = await browserRequest('get', '/api/customers');
    customer = response.data.find(entry => entry.name === marker);
    assert.ok(customer, 'Acquired customer was not persisted');
    const currentUser = await evaluate("JSON.parse(localStorage.getItem('user'))");
    assert.equal(customer.addedBy?._id || customer.addedBy, currentUser._id);
    assert.equal(customer.status, 'active'); assert.equal(customer.companyType, 'dealer');
    assert.equal(response.data.filter(entry => entry.name === marker).length, 1);
  });
  await catalogCheck('Employee customer search and read-only details display the actual creator', async () => {
    await fillInput('input[placeholder="Search customer"]', marker);
    assert.ok((await state()).text.includes(marker)); assert.equal((await state()).text.includes(settings.customerName), false);
    const route = `/employee/customers/${customer.customerId}`;
    assert.equal(await evaluate(`(() => { const link = document.querySelector('a[href=${JSON.stringify(route)}]'); if(!link)return false;link.click();return true; })()`), true);
    await until(async () => { const view = await state(); return view.path === route && view.text.includes('Customer Details') && view.text.includes(marker); });
    assert.ok((await state()).text.includes(settings.employeeName));
    assert.equal(await evaluate('!!document.querySelector("form,input,textarea,select")'), false);
    await cdp('Page.reload', { ignoreCache: true });
    await until(async () => (await state()).text.includes(marker));
  });
  await catalogCheck('Employee Product Catalog provides search and read-only product details', async () => {
    await navigate('/employee/products', 'Product Catalog');
    await fillInput('input[placeholder="Search product by name, code or description"]', settings.productName);
    await expandProduct(settings.productName);
    const view = await state();
    assert.ok(view.text.includes('Disposable test fixture')); assert.ok(view.text.includes('100'));
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => /^(Add Product|Edit|Delete)$/.test(button.innerText.trim()))"), false);
    quotedProduct = (await browserRequest('get', '/api/products')).data.find(entry => entry.name === settings.productName);
    assert.ok(quotedProduct);
  });
  await catalogCheck('Employee selects the acquired customer and active product in a saved quotation draft', async () => {
    await navigate('/employee/quotations', 'My Quotations'); await clickButton('New quotation');
    await until(async () => (await state()).text.includes('New Quotation'));
    await selectCatalog('Search customers...', marker); await selectCatalog('Search products...', settings.productName);
    await quotationInput('Quantity', settings.productName, '2'); await quotationInput('GST', settings.productName, '0');
    await fillInput('input[aria-label="Valid Until"]', validUntil);
    await fillInput('textarea[aria-label="Additional notes"]', marker);
    await clickButton('Save as Draft'); await until(async () => (await state()).path === '/employee/quotations');
    const created = (await browserRequest('get', '/api/quotations')).data.quotations.find(entry => entry.notes === marker);
    assert.ok(created); quotationId = created._id; quotationNumber = created.quotationId;
    const quote = await quotationRecord(quotationId);
    assert.equal(quote.customerId._id, customer._id); assert.equal(quote.items[0].productId._id, quotedProduct._id);
    assert.equal(quote.status, 'DRAFT'); assert.equal(quote.grandTotal, 200); assert.equal(quote.items[0].gstRate, 0);
  });
  await catalogCheck('Employee submits the acquired-customer quotation and sees the locked status', async () => {
    await navigate(`/employee/quotations/${quotationId}`, quotationNumber);
    await clickButton('Submit for Approval'); await until(async () => (await state()).text.includes('Submitted'));
    assert.equal((await quotationRecord(quotationId)).status, 'SUBMITTED');
    await logout();
  });
  await catalogCheck('Admin sees the acquired customer and complete submitted quotation', async () => {
    await login(settings.adminEmail, 'admin'); await navigate('/admin/customers', marker);
    await navigate(`/admin/customers/${customer.customerId}`, 'Customer Details');
    for (const value of [marker, settings.employeeName, 'Disposable acquired customer address']) assert.ok((await state()).text.includes(value));
    await navigate('/admin/quotations', quotationNumber);
    await navigate(`/admin/quotations/${quotationId}`, quotationNumber);
    for (const value of [marker, settings.productName, settings.employeeName, '200.00', 'Submitted']) assert.ok((await state()).text.includes(value));
  }, { allowDashboardFailure: true });
  await catalogCheck('Admin customer creation and editing remain functional', async () => {
    await navigate('/admin/customers', 'Customer Management'); await clickButton('Add Customer');
    await until(async () => (await state()).text.includes('Add New Customer'));
    await fillInput('#customer-name', adminCustomerName); await clickButton('Save');
    await until(async () => { const view = await state(); return view.text.includes(adminCustomerName) && !view.text.includes('Add New Customer'); });
    adminCustomer = (await browserRequest('get', '/api/customers')).data.find(entry => entry.name === adminCustomerName);
    assert.ok(adminCustomer); await clickCustomerAction(adminCustomer.customerId, 'Edit');
    await until(async () => (await state()).text.includes('Edit Customer'));
    await fillInput('#customer-address', 'Admin edited customer address'); await clickButton('Save');
    await until(async () => (await state()).text.includes('Admin edited customer address') && !(await state()).text.includes('Edit Customer'));
  });
  await catalogCheck('Admin customer archiving remains functional and removes the record from shared reads', async () => {
    promptResponse = '';
    await clickCustomerAction(adminCustomer.customerId, 'Archive');
    await until(async () => !(await state()).text.includes(adminCustomerName));
    assert.equal((await browserRequest('get', '/api/customers')).data.some(entry => entry._id === adminCustomer._id), false);
  });
  await catalogCheck('Admin product creation and editing preserve the existing shared form, including zero price', async () => {
    await navigate('/admin/products', 'Product Management'); await clickButton('Add Product');
    await fillInput('input[name="name"]', adminProductName); await fillInput('textarea[name="description"]', 'M3 Admin-created disposable product'); await fillInput('input[name="price"]', '0');
    await clickButton('Save'); await until(async () => (await state()).text.includes(adminProductName) && !(await state()).text.includes('Add New Product'));
    adminProduct = (await browserRequest('get', '/api/products')).data.find(entry => entry.name === adminProductName);
    assert.ok(adminProduct); assert.equal(adminProduct.price, 0);
    await fillInput('input[placeholder="Search product by name, code or description"]', adminProductName);
    await expandProduct(adminProductName); await clickButton('Edit');
    await until(async () => (await state()).text.includes('Edit Product'));
    await fillInput('input[name="price"]', '12.5'); await clickButton('Save');
    await until(async () => !(await state()).text.includes('Edit Product'));
    assert.equal((await browserRequest('get', '/api/products')).data.find(entry => entry._id === adminProduct._id).price, 12.5);
  });
  await catalogCheck('Admin product deletion remains functional without exposing removed products in shared reads', async () => {
    await expandProduct(adminProductName); await clickButton('Delete');
    await until(async () => !(await state()).text.includes(adminProductName));
    assert.equal((await browserRequest('get', '/api/products')).data.some(entry => entry._id === adminProduct._id), false);
  });
  await catalogCheck('Admin product updates preserve the already submitted quotation commercial snapshots', async () => {
    await fillInput('input[placeholder="Search product by name, code or description"]', settings.productName);
    await expandProduct(settings.productName); await clickButton('Edit');
    await fillInput('input[name="name"]', `${settings.productName} updated`); await fillInput('input[name="price"]', '999'); await clickButton('Save');
    await until(async () => !(await state()).text.includes('Edit Product'));
    const quote = await quotationRecord(quotationId);
    assert.equal(quote.items[0].productName, settings.productName); assert.equal(quote.items[0].unitPrice, 100); assert.equal(quote.grandTotal, 200);
    await navigate(`/admin/quotations/${quotationId}`, quotationNumber);
    assert.equal((await state()).text.includes(`${settings.productName} updated`), false);
    const capture = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(settings.tempDir, 'm3-acquired-customer-quotation.png'), Buffer.from(capture.data, 'base64'), { mode: 0o600 });
    await logout();
  });
  await catalogCheck('Employee B can read the acquired customer through approved shared catalog visibility', async () => {
    await login(settings.employeeBEmail, 'employee');
    await navigate('/employee/customers', marker); await navigate(`/employee/customers/${customer.customerId}`, 'Customer Details');
    assert.ok((await state()).text.includes(settings.employeeName));
    await navigate('/employee/products', 'Product Catalog');
    assert.ok((await state()).text.includes(`${settings.productName} updated`));
    assert.equal((await state()).nav.some(entry => entry.path.includes('/orders')), false);
  });
  await catalogCheck('Employee direct Customer and Product mutations fail with unchanged records and active session', async () => {
    const beforeCustomer = (await browserRequest('get', `/api/customers/${customer.customerId}`)).data;
    const beforeProducts = (await browserRequest('get', '/api/products')).data;
    for (const [method, endpoint, data] of [
      ['put', `/api/customers/${customer.customerId}`, { name: 'Unauthorized changed customer', addedBy: '507f1f77bcf86cd799439011' }],
      ['delete', `/api/customers/${customer.customerId}`],
      ['post', '/api/products', { name: 'Unauthorized product', description: 'Forbidden', price: 1 }],
      ['put', `/api/products/${quotedProduct.productId}`, { name: 'Unauthorized changed product', price: 1 }],
      ['delete', `/api/products/${quotedProduct.productId}`],
    ]) assert.equal((await browserRequest(method, endpoint, data)).status, 403);
    assert.deepEqual((await browserRequest('get', `/api/customers/${customer.customerId}`)).data, beforeCustomer);
    assert.deepEqual((await browserRequest('get', '/api/products')).data, beforeProducts);
    assert.equal((await state()).tokenPresent, true); await logout();
  }, { expectedAuthStatus: 403 });
  results.obsoleteOrRestrictedRequests = requests.filter(entry => entry.path.startsWith('/api/employee/') ||
    (entry.stage.startsWith('Employee') && (entry.path.startsWith('/api/employees') || entry.path === '/api/dashboard/dashboard-metrics')));
  assert.deepEqual(results.obsoleteOrRestrictedRequests, []);
  results.legacyImageRequests = legacyImageRequests;
  assert.deepEqual(legacyImageRequests, [], 'Product images must not request the missing fallback asset');
  await Promise.all(bodyChecks); assert.deepEqual(results.secretFindings, []);
}

async function orderWorkflow() {
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  const step = async (...args) => {
    await check(...args);
    if (!results.checks.at(-1).passed) throw new Error('Order browser workflow stopped at: ' + results.checks.at(-1).name);
  };
  const marker = `M4 browser quotation ${Date.now()}`;
  let quotationId, quotationNumber, approved, orderId;
  const readOrder = async () => {
    const response = await browserRequest('get', `/api/orders/${orderId}`);
    assert.equal(response.status, 200);
    return response.data.order;
  };
  const advance = async status => {
    await evaluate(`(() => {
      const select = document.querySelector('select[aria-label="Next order status"]');
      select.value = ${JSON.stringify(status)};
      select.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await clickButton('Update status');
    await until(async () => (await readOrder()).status === status);
    await until(() => evaluate(`!document.querySelector('fieldset[aria-busy="true"]')`));
  };
  await step('Employee creates an exact-price multi-product draft in the shared quotation form', async () => {
    await login(settings.employeeEmail, 'employee');
    await navigate('/employee/quotations', 'My Quotations');
    await clickButton('New quotation');
    await until(async () => (await state()).text.includes('New Quotation'));
    await selectCatalog('Search customers...', settings.customerName);
    await selectCatalog('Search products...', settings.productName);
    await quotationInput('Quantity', settings.productName, '2');
    await quotationInput('Discount', settings.productName, '10');
    await quotationInput('GST', settings.productName, '0');
    await selectCatalog('Search products...', settings.roundingProductName);
    await quotationInput('Discount percentage', settings.roundingProductName, '10');
    await fillInput('input[aria-label="Valid Until"]', new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    await fillInput('textarea[aria-label="Additional notes"]', marker);
    await clickButton('Save as Draft');
    await until(async () => (await state()).path === '/employee/quotations');
    const response = await browserRequest('get', '/api/quotations');
    const created = response.data.quotations.find(quote => quote.notes === marker);
    assert.ok(created); quotationId = created._id; quotationNumber = created.quotationId;
    assert.equal(created.status, 'DRAFT'); assert.equal(created.grandTotal, 190.05);
  });
  await step('Employee submits the draft and cannot convert it', async () => {
    await navigate(`/employee/quotations/${quotationId}`, quotationNumber);
    await clickButton('Submit for Approval');
    await until(async () => (await state()).text.includes('Submitted'));
    assert.equal((await quotationRecord(quotationId)).status, 'SUBMITTED');
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => button.innerText.trim() === 'Convert to Order')"), false);
    await logout();
  });
  await step('Admin reviews the submitted snapshot, approves and converts through the existing details page', async () => {
    await login(settings.adminEmail, 'admin');
    await navigate(`/admin/quotations/${quotationId}`, quotationNumber);
    await clickButton('Approve');
    await until(async () => (await quotationRecord(quotationId)).status === 'APPROVED');
    approved = await quotationRecord(quotationId);
    await until(() => evaluate("[...document.querySelectorAll('button')].some(button => button.innerText.trim() === 'Convert to Order' && !button.disabled)"));
    await clickButton('Convert to Order');
    await until(async () => (await state()).text.includes('Converted quotations are read-only.'));
    const orders = await browserRequest('get', '/api/orders');
    const order = orders.data.find(entry => entry.quotationNumber === quotationNumber);
    assert.ok(order); orderId = order.orderId;
    assert.equal(order.status, 'confirm'); assert.equal(order.totalSnapshot, approved.grandTotal);
    for (const field of ['subtotal', 'discountAmount', 'taxableAmount', 'gstAmount', 'grandTotal']) assert.equal(order[field], approved[field]);
    order.productsSnapshot.forEach((item, index) => {
      for (const field of ['quantity', 'unitPrice', 'discountAmount', 'discountPercentage', 'gstRate', 'gstAmount', 'taxableAmount', 'lineTotal']) assert.equal(item[field], approved.items[index][field]);
      assert.equal(item.name, approved.items[index].productName);
    });
    assert.equal((await quotationRecord(quotationId)).status, 'CONVERTED');
    assert.ok((await state()).text.includes(`Open order ${orderId}`));
  }, { allowDashboardFailure: true });
  await step('Admin opens Orders and deep-linked details with frozen commercial and customer information', async () => {
    await navigate('/admin/orders', orderId);
    await navigate(`/admin/orders/${orderId}`, 'Order Details');
    await until(async () => (await state()).text.includes(settings.productName));
    const view = await state();
    for (const text of [orderId, quotationNumber, settings.customerName, settings.productName, '190.05', 'Confirmed', '0%']) assert.ok(view.text.includes(text), `Missing ${text}`);
    assert.doesNotMatch(view.text, /undefined|Invalid Date|NaN/);
    assert.deepEqual((await readOrder()).allowedTransitions, ['dispatched', 'cancelled']);
    assert.ok(await evaluate(`!!document.querySelector('a[href="/admin/quotations/${quotationId}"]')`));
  });
  await step('Admin dispatches the Order and refetches the saved fulfillment timestamp', async () => {
    await advance('dispatched');
    const order = await readOrder(); assert.ok(order.dispatchedDate);
    assert.deepEqual(order.allowedTransitions, ['delivered']);
    await clickButton('Refresh');
    await until(async () => (await state()).text.includes('Dispatched'));
  });
  await step('Admin records delivery and a browser refresh preserves fulfillment and prices', async () => {
    await advance('delivered');
    assert.ok((await readOrder()).deliveredAt);
    await cdp('Page.reload', { ignoreCache: true });
    await until(async () => (await state()).text.includes('Delivered') && (await state()).text.includes('190.05'));
    const order = await readOrder(); assert.equal(order.totalSnapshot, approved.grandTotal);
    const capture = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(settings.tempDir, 'm4-delivered-order.png'), Buffer.from(capture.data, 'base64'), { mode: 0o600 });
  });
  await step('Admin closes the delivered Order and no reopening or cancellation control remains', async () => {
    await advance('closed');
    const order = await readOrder(); assert.ok(order.closedAt); assert.deepEqual(order.allowedTransitions, []);
    await until(async () => (await state()).text.includes('No further status changes are available.'));
    assert.ok((await state()).text.includes('It does not record payment.'));
    assert.equal(await evaluate('!!document.querySelector(\'select[aria-label="Next order status"]\')'), false);
  });
  await step('Conversion retry returns the same Order without duplicate or source-price changes', async () => {
    const response = await browserRequest('post', `/api/quotations/${quotationId}/convert`, {});
    assert.equal(response.status, 200); assert.equal(response.data.order.orderId, orderId); assert.equal(response.data.replayed, true);
    const orders = await browserRequest('get', '/api/orders');
    assert.equal(orders.data.filter(order => order.quotationNumber === quotationNumber).length, 1);
    const quote = await quotationRecord(quotationId);
    assert.equal(quote.grandTotal, approved.grandTotal);
    assert.deepEqual(quote.items, approved.items);
  });
  await step('Existing PDF and CSV controls download successfully from stored Order snapshots', async () => {
    for (const kind of ['PDF', 'CSV']) {
      await clickButton(`Download ${kind}`);
      await until(() => evaluate('!document.querySelector(\'fieldset[aria-busy="true"]\')'));
      assert.ok(requests.some(entry => entry.stage === stage && entry.path === `/api/orders/${orderId}/download-${kind.toLowerCase()}` && entry.status === 200));
    }
    const exports = await evaluate(`import('/src/api/axios.js').then(async ({default:api}) => {
      const pdf=await api.get('/api/orders/${orderId}/download-pdf',{responseType:'arraybuffer'});
      const csv=await api.get('/api/orders/${orderId}/download-csv');
      return {pdfMagic:new TextDecoder().decode(new Uint8Array(pdf.data).slice(0,5)),csv:csv.data};
    })`);
    assert.equal(exports.pdfMagic, '%PDF-');
    assert.ok(exports.csv.includes('Grand Total (INR),190.05')); assert.ok(exports.csv.includes(settings.productName));
    await logout();
  });
  await step('Employee sees the converted read-only quotation and has no Orders navigation', async () => {
    await login(settings.employeeEmail, 'employee');
    await navigate(`/employee/quotations/${quotationId}`, 'Converted quotations are read-only.');
    assert.equal((await quotationRecord(quotationId)).status, 'CONVERTED');
    assert.ok((await state()).nav.every(link => !link.path.includes('orders')));
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => ['Edit','Approve','Reject','Convert to Order'].includes(button.innerText.trim()))"), false);
  });
  await step('Employee direct Order and conversion APIs remain forbidden', async () => {
    for (const [method, endpoint, data] of [['get','/api/orders'], ['get',`/api/orders/${orderId}`], ['put',`/api/orders/${orderId}`,{status:'cancelled',reason:'Forbidden'}], ['get',`/api/orders/${orderId}/download-pdf`], ['get',`/api/orders/${orderId}/download-csv`], ['post',`/api/quotations/${quotationId}/convert`,{}]]) {
      assert.equal((await browserRequest(method, endpoint, data)).status, 403);
    }
    await cdp('Page.navigate', {url: new URL(`/admin/orders/${orderId}`,settings.frontendUrl).href});
    await until(async () => (await state()).text.includes('Access Denied'));
    assert.equal((await state()).text.includes(settings.productName),false);
  }, {expectedAuthStatus:403});
  await step('Employee B cannot read the converted source quotation', async () => {
    await navigate('/employee/profile', settings.employeeEmail);
    await logout(); await login(settings.employeeBEmail,'employee');
    await navigate(`/employee/quotations/${quotationId}`, 'Quotation not found');
    await logout();
  }, {expectedAuthStatus:404});
  results.obsoleteOrRestrictedRequests = requests.filter(entry => entry.path.startsWith('/api/employee/') || (entry.stage.startsWith('Employee') && entry.path === '/api/dashboard/dashboard-metrics'));
  assert.deepEqual(results.obsoleteOrRestrictedRequests, []);
  await Promise.all(bodyChecks); assert.deepEqual(results.secretFindings, []);
}

async function quotationWorkflow() {
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  const quotationCheck = async (...args) => {
    await check(...args);
    if (!results.checks.at(-1).passed) throw new Error('Quotation browser workflow stopped at: ' + results.checks.at(-1).name);
  };
  const marker = `M2 employee browser quotation ${Date.now()}`;
  const reason = 'Please confirm the quantity and zero GST agreement.';
  const validUntil = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  let quotationId, quotationNumber;
  await quotationCheck('Employee logs in and creates a commercially complete draft through the shared form', async () => {
    await login(settings.employeeEmail, 'employee');
    await navigate('/employee/quotations', 'My Quotations');
    await clickButton('New quotation');
    await until(async () => (await state()).path === '/employee/quotation' && (await state()).text.includes('New Quotation'));
    await selectCatalog('Search customers...', settings.customerName);
    await selectCatalog('Search products...', settings.productName);
    await quotationInput('Quantity', settings.productName, '2');
    await quotationInput('Discount', settings.productName, '10');
    await quotationInput('GST', settings.productName, '0');
    await selectCatalog('Search products...', settings.roundingProductName);
    await quotationInput('Discount percentage', settings.roundingProductName, '10');
    await fillInput('input[aria-label="Valid Until"]', validUntil);
    await fillInput('textarea[aria-label="Additional notes"]', marker);
    await verifyDiscountLayout();
    await clickButton('Save as Draft');
    await until(async () => (await state()).path === '/employee/quotations');
    const created = await evaluate(`import('/src/api/axios.js').then(({default:api}) => api.get('/api/quotations').then(response => response.data.quotations.find(quote => quote.notes === ${JSON.stringify(marker)})))`);
    assert.ok(created, 'Draft was not persisted');
    quotationId = created._id; quotationNumber = created.quotationId;
    const details = await quotationRecord(quotationId);
    assert.equal(details.status, 'DRAFT'); assert.equal(details.grandTotal, 190.05);
    assert.equal(details.items.length, 2); assert.equal(details.items[0].gstRate, 0);
    assert.equal(details.items[1].discountAmount, 0.01); assert.equal(details.items[1].lineTotal, 0.05);
    assert.ok((await state()).text.includes(quotationNumber));
  });
  await quotationCheck('Employee edits the same draft with prefilled customer/pricing and no duplicate record', async () => {
    await navigate(`/employee/quotations/${quotationId}`, quotationNumber);
    assert.ok((await state()).text.includes('190.05'));
    await clickButton('Edit');
    await until(async () => (await state()).path.endsWith('/edit') && (await state()).text.includes('Edit Quotation'));
    await until(() => evaluate(`!!document.querySelector('input[aria-label="Quantity for ${settings.productName}"]')`));
    assert.equal(await evaluate(`document.querySelector('input[aria-label="GST for ${settings.productName}"]').value`), '0');
    assert.equal(await evaluate(`document.querySelector('input[aria-label="Quantity for ${settings.productName}"]').value`), '2');
    assert.equal(await evaluate('document.querySelector(\'input[aria-label="Valid Until"]\').value'), validUntil);
    await quotationInput('Quantity', settings.productName, '3');
    await fillInput('textarea[aria-label="Additional notes"]', `${marker} edited`);
    await clickButton('Save as Draft');
    await until(async () => (await state()).path === `/employee/quotations/${quotationId}` && (await state()).text.includes('290.05'));
    const details = await quotationRecord(quotationId);
    assert.equal(details.quotationId, quotationNumber); assert.equal(details.grandTotal, 290.05);
    const duplicates = await evaluate(`import('/src/api/axios.js').then(({default:api}) => api.get('/api/quotations').then(response => response.data.quotations.filter(quote => quote.notes.startsWith(${JSON.stringify(marker)})).length))`);
    assert.equal(duplicates, 1);
  });
  await quotationCheck('Employee submits and the read-only details immediately show the locked status', async () => {
    await clickButton('Submit for Approval');
    await until(async () => (await state()).text.includes('Submitted'));
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => ['Edit','Approve','Reject','Submit for Approval'].includes(button.innerText.trim()))"), false);
    const quote = await quotationRecord(quotationId);
    assert.equal(quote.status, 'SUBMITTED'); assert.ok(quote.submittedAt);
    await logout();
  });
  await quotationCheck('Admin sees the Employee submission and rejects with a reason through the existing review controls', async () => {
    await login(settings.adminEmail, 'admin');
    await navigate('/admin/quotations', quotationNumber);
    await navigate(`/admin/quotations/${quotationId}`, quotationNumber);
    const view = await state();
    for (const value of [settings.customerName, settings.employeeName, settings.productName, '290.05']) assert.ok(view.text.includes(value));
    assert.equal(await evaluate('!!document.querySelector("textarea,input,select")'), false);
    promptResponse = reason;
    await clickButton('Reject');
    await until(async () => (await state()).text.includes(reason) && (await state()).text.includes('Rejected'));
    assert.ok((await state()).text.includes('Smoke Admin'));
    await logout();
  }, { allowDashboardFailure: true });
  await quotationCheck('Employee sees rejection, revises and reopens without losing the latest rejection', async () => {
    await login(settings.employeeEmail, 'employee');
    await navigate(`/employee/quotations/${quotationId}`, reason);
    await clickButton('Edit');
    await until(async () => (await state()).path.endsWith('/edit') && (await state()).text.includes('Edit Quotation'));
    await until(() => evaluate(`!!document.querySelector('input[aria-label="Quantity for ${settings.productName}"]')`));
    await quotationInput('Quantity', settings.productName, '4');
    await fillInput('textarea[aria-label="Additional notes"]', `${marker} revised after rejection`);
    await clickButton('Save as Draft');
    await until(async () => (await state()).path === `/employee/quotations/${quotationId}` && (await state()).text.includes('Most recent rejection'));
    const quote = await quotationRecord(quotationId);
    assert.equal(quote.status, 'DRAFT'); assert.equal(quote.rejectionReason, reason); assert.ok(quote.rejectedAt);
    assert.equal(quote.grandTotal, 390.05); assert.ok((await state()).text.includes('Smoke Admin'));
    assert.ok((await state()).text.includes(reason));
  });
  await quotationCheck('Employee resubmits revised quotation with the retained decision visible', async () => {
    await clickButton('Submit for Approval');
    await until(async () => (await state()).text.includes('Submitted'));
    const view = await state(); assert.ok(view.text.includes('Most recent rejection')); assert.ok(view.text.includes(reason));
    await navigate('/employee/quotations', quotationNumber);
    assert.ok((await state()).text.includes('Submitted')); assert.ok((await state()).text.includes('390.05'));
    await logout();
  });
  await quotationCheck('Admin approves the revised Employee quotation with the same stored prices', async () => {
    await login(settings.adminEmail, 'admin');
    await navigate(`/admin/quotations/${quotationId}`, 'Submitted');
    await clickButton('Approve');
    await until(async () => (await state()).text.includes('Approved quotation.'));
    const quote = await quotationRecord(quotationId);
    assert.equal(quote.status, 'APPROVED'); assert.equal(quote.grandTotal, 390.05); assert.equal(quote.rejectionReason, reason);
    const capture = await cdp('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(settings.tempDir, 'm2-admin-approved-quotation.png'), Buffer.from(capture.data, 'base64'), { mode: 0o600 });
    await logout();
  }, { allowDashboardFailure: true });
  await quotationCheck('Employee refresh sees approval/reviewer and cannot edit approved data', async () => {
    await login(settings.employeeEmail, 'employee');
    await navigate(`/employee/quotations/${quotationId}`, 'Approved quotation.');
    await cdp('Page.reload', { ignoreCache: true });
    await until(async () => (await state()).text.includes('Approved quotation.'));
    const view = await state(); assert.ok(view.text.includes('Approval')); assert.ok(view.text.includes('Most recent rejection')); assert.ok(view.text.includes('390.05'));
    assert.equal(await evaluate("[...document.querySelectorAll('button')].some(button => ['Edit','Approve','Reject','Submit for Approval'].includes(button.innerText.trim()))"), false);
    await navigate(`/employee/quotations/${quotationId}/edit`, 'This quotation is locked');
    assert.equal(await evaluate('!!document.querySelector("textarea,input,select")'), false);
    await logout();
  });
  await quotationCheck('Employee B cannot read another Employee quotation deep link', async () => {
    await login(settings.employeeBEmail, 'employee');
    await navigate('/employee/quotations', 'My Quotations');
    assert.equal((await state()).text.includes(quotationNumber), false);
    await navigate(`/employee/quotations/${quotationId}`, 'Quotation not found');
    assert.equal((await state()).text.includes(settings.productName), false);
  }, { expectedAuthStatus: 404 });
  await quotationCheck('Employee B cannot edit another Employee quotation deep link', async () => {
    await navigate(`/employee/quotations/${quotationId}/edit`, 'Quotation not found');
    assert.equal(await evaluate('!!document.querySelector("textarea,input,select")'), false);
    await logout();
  }, { expectedAuthStatus: 404 });
  await quotationCheck('Admin creation and editing keep the shared form and half-up zero-GST pricing', async () => {
    await login(settings.adminEmail, 'admin');
    await navigate('/admin/add-quotation', 'New Quotation');
    await selectCatalog('Search customers...', settings.customerName);
    await selectCatalog('Search employees...', settings.employeeName);
    await selectCatalog('Search products...', settings.productName);
    await quotationInput('Unit price', settings.productName, '1.005');
    await quotationInput('GST', settings.productName, '0');
    await fillInput('input[aria-label="Valid Until"]', validUntil);
    const notes = `${marker} Admin regression`;
    await fillInput('textarea[aria-label="Additional notes"]', notes);
    await clickButton('Save as Draft');
    await until(async () => (await state()).path === '/admin/quotations');
    const created = await evaluate(`import('/src/api/axios.js').then(({default:api}) => api.get('/api/quotations').then(response => response.data.quotations.find(quote => quote.notes === ${JSON.stringify(notes)})))`);
    assert.ok(created); assert.equal(created.grandTotal, 1.01);
    await navigate(`/admin/quotations/${created._id}`, created.quotationId); await clickButton('Edit');
    await until(() => evaluate(`!!document.querySelector('input[aria-label="Quantity for ${settings.productName}"]')`));
    assert.equal(await evaluate(`document.querySelector('input[aria-label="Unit price for ${settings.productName}"]').value`), '1.01');
    await quotationInput('Quantity', settings.productName, '2'); await clickButton('Save as Draft');
    await until(async () => (await state()).path === `/admin/quotations/${created._id}` && (await state()).text.includes('2.02'));
    const quote = await quotationRecord(created._id); assert.equal(quote.createdBy.name, 'Smoke Admin'); assert.equal(quote.employeeId.name, settings.employeeName);
    await navigate('/admin/tasks', 'Task Management'); assert.ok((await state()).text.includes('Smoke assigned task'));
    await logout();
  }, { allowDashboardFailure: true });
  results.obsoleteOrRestrictedRequests = requests.filter(entry => entry.path.startsWith('/api/employee/') ||
    (entry.stage.startsWith('Employee') && (entry.path.startsWith('/api/employees') || entry.path === '/api/dashboard/dashboard-metrics')));
  assert.deepEqual(results.obsoleteOrRestrictedRequests, []);
  await Promise.all(bodyChecks); assert.deepEqual(results.secretFindings, []);
}

(async () => {
  const browserPath = process.env.BROWSER_PATH || "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
  const profile = path.join(settings.tempDir, "issue3-browser-profile");
  browser = spawn(browserPath, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--disable-background-networking", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  let launchError;
  browser.on("error", (error) => { launchError = error; });
  const activePort = path.join(profile, "DevToolsActivePort");
  await until(() => { if (launchError) throw launchError; return fs.existsSync(activePort); });
  const port = Number(fs.readFileSync(activePort, "utf8").split("\n")[0]);
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (request) { clearTimeout(request.timeout); pending.delete(message.id); message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result); }
      return;
    }
    const data = message.params || {};
    if (message.method === "Page.javascriptDialogOpening") {
      const answer = promptResponse;
      promptResponse = undefined;
      void cdp("Page.handleJavaScriptDialog", { accept: answer !== undefined, promptText: answer || "" });
    }
    if (message.method === "Network.requestWillBeSent" && data.request.url.startsWith(settings.backendUrl)) {
      backendRequests.set(data.requestId, new URL(data.request.url).pathname);
    }
    if (message.method === "Network.requestWillBeSent" && data.request.url.startsWith(settings.frontendUrl) && new URL(data.request.url).pathname === "/fallback.png") {
      legacyImageRequests.push({ stage, path: "/fallback.png" });
    }
    if (message.method === "Network.responseReceived" && data.response.url.startsWith(settings.backendUrl)) {
      requests.push({ stage, path: new URL(data.response.url).pathname, status: data.response.status });
      if (data.response.mimeType?.includes("json")) inspectBodies.add(data.requestId);
    }
    if (message.method === "Network.loadingFinished" && inspectBodies.delete(data.requestId)) {
      const inspection = cdp("Network.getResponseBody", { requestId: data.requestId }).then((body) => {
        const value = JSON.parse(body.base64Encoded ? Buffer.from(body.body, "base64").toString() : body.body);
        const keys = secretPaths(value);
        if (keys.length) results.secretFindings.push({ stage, keys });
      }).catch(() => {}).finally(() => bodyChecks.delete(inspection));
      bodyChecks.add(inspection);
    }
    if (message.method === "Network.loadingFailed" && !data.canceled && backendRequests.has(data.requestId)) {
      requests.push({ stage, path: backendRequests.get(data.requestId), failed: true, error: safeMessage(data.errorText) });
    }
    if (message.method === "Runtime.exceptionThrown") results.exceptions.push({ stage, message: safeMessage(data.exceptionDetails.exception?.description || data.exceptionDetails.text) });
    if (message.method === "Runtime.consoleAPICalled") {
      const logged = (data.args || []).map((arg) => arg.value || arg.description || "").join(" ");
      if (/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|\$2[aby]\$\d\d\$/.test(logged)) results.secretFindings.push({ stage, source: "browser console" });
    }
  });
  await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Network.enable");

  if (settings.scenario === "orders") {
    await orderWorkflow();
    return;
  }

  if (settings.scenario === "catalogs") {
    await catalogWorkflow();
    return;
  }

  if (settings.scenario === "quotations") {
    await quotationWorkflow();
    return;
  }

  if (settings.scenario === "tasks") {
    await taskWorkflow();
    return;
  }

  await check("Unauthenticated Employee deep link redirects to login", async () => {
    await cdp("Page.navigate", { url: new URL("/employee/profile", settings.frontendUrl).href });
    await until(async () => { const view = await state(); return view.path === "/" && view.text.includes("Welcome Back"); });
  });
  await check("Admin UI login and Dashboard render", async () => {
    await login(settings.adminEmail, "admin");
    await until(async () => (await state()).text.includes("Pending Tasks"));
  }, { allowDashboardFailure: true });
  await check("Admin Tasks render", () => navigate("/admin/tasks", "Task Management"));
  await check("Admin Quotations render", () => navigate("/admin/quotations", settings.quotationNumber || "QT-SMOKE-001"));
  await check("Admin existing quotation details render", () => navigate(`/admin/quotations/${settings.quotationId}`, settings.quotationNumber || "QT-SMOKE-001"));
  await check("Admin self Profile renders", async () => { const view = await navigate("/admin/profile", settings.adminEmail); assert.doesNotMatch(view.text, /Invalid Date|undefined/); });
  await check("Admin visible logout clears session", logout);
  await check("Employee UI login reaches stable landing", async () => {
    await login(settings.employeeEmail, "employee");
    const capture = await cdp("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(settings.tempDir, "employee-landing.png"), Buffer.from(capture.data, "base64"), { mode: 0o600 });
  });
  await check("Every visible Employee navigation destination renders and is active", async () => {
    const links = (await state()).nav;
    assert.deepEqual(links.map((link) => link.path), ["/employee/dashboard", "/employee/tasks", "/employee/customers", "/employee/products", "/employee/quotations", "/employee/profile"]);
    const titles = {
      "/employee/dashboard": "Dashboard", "/employee/tasks": "My Tasks",
      "/employee/customers": "Customer Management", "/employee/products": "Product Catalog",
      "/employee/quotations": "My Quotations", "/employee/profile": settings.employeeEmail,
    };
    for (const link of links) {
      await navigate(link.path, titles[link.path]);
      await until(async () => (await state()).nav.some((entry) => entry.path === link.path && entry.active === "page"));
    }
  });
  await check("Employee self Profile is correct and optional fields render safely", async () => {
    const view = await navigate("/employee/profile", settings.employeeEmail);
    assert.ok(view.text.includes(settings.employeeIdentifier || "EMP-SMOKE-EMPLOYEE"));
    assert.doesNotMatch(view.text, /Invalid Date|undefined|password|\$2[aby]\$/i);
    assert.equal(await evaluate("!!document.querySelector('form,input,textarea')"), false);
    const capture = await cdp("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(settings.tempDir, "employee-profile.png"), Buffer.from(capture.data, "base64"), { mode: 0o600 });
  });
  await check("Employee route refresh retains verified session", async () => {
    await cdp("Page.reload", { ignoreCache: true });
    await until(async () => { const view = await state(); return view.path === "/employee/profile" && view.text.includes(settings.employeeEmail); });
  });
  await check("Malformed cached identity is replaced by server identity", async () => {
    await evaluate("localStorage.setItem('user','{malformed')");
    await navigate("/employee/profile", settings.employeeEmail);
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('user')).role"), "employee");
  });
  await check("Forged cached Admin role cannot open an Admin page", async () => {
    await evaluate("localStorage.setItem('user',JSON.stringify({role:'admin',permissions:['TASK_READ','EMPLOYEE_READ']}))");
    await cdp("Page.navigate", { url: new URL("/admin/tasks", settings.frontendUrl).href });
    await until(async () => (await state()).path === "/unauthorized");
    assert.equal(await evaluate("JSON.parse(localStorage.getItem('user')).role"), "employee");
    const returned = await evaluate("(() => {const button=[...document.querySelectorAll('button')].find(b=>b.innerText==='Go to Dashboard');if(!button)return false;button.click();return true;})()");
    assert.equal(returned, true);
    await until(async () => (await state()).path === "/employee/dashboard");
  });
  await check("Employee forbidden API response preserves the active session", async () => {
    const status = await evaluate("import('/src/api/axios.js').then(({default:api}) => api.get('/api/orders').then(r=>r.status).catch(e=>e.response?.status))");
    assert.equal(status, 403);
    assert.equal((await state()).tokenPresent, true);
    assert.equal((await state()).path, "/employee/dashboard");
  }, { expectedAuthStatus: 403 });
  await check("Employee logout clears credentials and preserves preferences", async () => {
    await evaluate("localStorage.setItem('worknest-smoke-preference','retained')");
    await logout();
    assert.equal(await evaluate("localStorage.getItem('worknest-smoke-preference')"), "retained");
  });
  await check("Protected navigation after logout requires login again", async () => {
    await cdp("Page.navigate", { url: new URL("/employee/profile", settings.frontendUrl).href });
    await until(async () => (await state()).path === "/");
    assert.equal((await state()).tokenPresent, false);
  });
  await check("Employee can log in again after logout", () => login(settings.employeeEmail, "employee"));
  await check("Invalid persisted JWT redirects to login", async () => {
    await evaluate("localStorage.setItem('token','invalid-session-token')");
    await cdp("Page.navigate", { url: new URL("/employee/profile", settings.frontendUrl).href });
    await until(async () => (await state()).path === "/");
    assert.equal((await state()).tokenPresent, false);
    // A 401 is expected for this deliberate invalid-token request.
  }, { expectedAuthStatus: 401 });
  // Record intentional 401 separately; all other Employee requests must succeed.
  const employeeRequests = requests.filter((entry) => /Employee|Malformed|Forged|Invalid persisted/.test(entry.stage));
  results.obsoleteOrRestrictedRequests = employeeRequests.filter((entry) => entry.path.startsWith("/api/employee/") || (entry.path.startsWith("/api/orders") && entry.stage !== "Employee forbidden API response preserves the active session") || entry.path === "/api/dashboard/dashboard-metrics");
  assert.deepEqual(results.obsoleteOrRestrictedRequests, []);
  await delay(100);
  await Promise.all(bodyChecks);
  assert.deepEqual(results.secretFindings, []);
})().catch((error) => { results.fatal = safeMessage(error.stack); process.exitCode = 1; }).finally(async () => {
  if (socket) { try { await cdp("Browser.close"); } catch { /* Browser may already have exited. */ } socket.close(); }
  if (browser && browser.exitCode === null) browser.kill("SIGTERM");
  // Credentials and token-bearing response bodies are deliberately never written.
  results.requests = requests;
  results.passed = !results.fatal && results.checks.every((entry) => entry.passed) && results.secretFindings.length === 0;
  const output = path.join(settings.tempDir, settings.scenario === "orders" ? "m4-order-browser-results.json" : settings.scenario === "catalogs" ? "m3-catalog-browser-results.json" : settings.scenario === "quotations" ? "m2-quotation-browser-results.json" : settings.scenario === "tasks" ? "m1-task-browser-results.json" : "issue3-browser-results.json");
  fs.writeFileSync(output, JSON.stringify(results, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ output, ...results, requests: undefined }, null, 2));
  if (!results.passed) process.exitCode = 1;
});
