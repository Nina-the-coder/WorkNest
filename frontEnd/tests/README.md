# Frontend session, Task, Quotation, Catalog and Order regression tests

Run from `frontEnd` after installing the existing frontend and backend dependencies:

```sh
npm test -- --runInBand --coverage=false
```

The rendered tests reuse the backend's installed Jest 27, Babel and jsdom, and the frontend's React 19 and React Router. No dependencies or lockfiles were added. The test configuration maps the router's conditional exports because Jest 27 predates that package layout. React components, the session provider and route guards are real; only authentication HTTP transport is mocked. Backend `/auth/me` integration tests and the browser checks below cover the real transport.

The tests cover role redirects, verified session hydration, malformed or forged cached identity, loading/error/retry states, permission denial, logout and in-flight response races, role-aware navigation, read-only self-profile and the Employee landing page.

`task.workflow.test.jsx` renders the shared Task hook, Employee list/details, status controls and existing Admin editor. It mocks HTTP transport only. It covers assigned Task fields, loading/empty/error/retry states, list refetch after status changes or reassignment, permission-aware actions, pending requests, detail denials, forward status actions, and normalized Admin assignee/date fields. Real ownership, transition and concurrency enforcement is exercised by the backend integration suite.


`quotation.views.test.jsx` renders shared quotation lists/details and workflow controls. It covers role/ownership/permission visibility, existing deep links, stored line/header amounts, filtered membership/count refetching, retry/focus refresh, decision metadata and latest-rejection labels, pending duplicate prevention, and stale detail-response protection. The transport is mocked; persisted calculations, ownership and rejection retention are verified separately by `backEnd/tests/integration/quotation.workflow.test.js` using real HTTP and a disposable replica set.

`customer.integration.test.jsx` and `product.catalog.test.jsx` exercise the shared Customer and Product pages with mocked HTTP transport. Customer tests cover create validation, authenticated-creator presentation, read-only Employee actions, shared details, loading/errors/retry, search/filters and safe repeated submissions. Product tests cover the read-only Employee catalog, Admin CRUD controls, name/code/description search, images, refresh/races, permission loss, keyboard details and pending/failed Admin saves. Actual API permissions, persistence, creator identity, duplicate protection and quotation integration use `backEnd/tests/integration/customer.catalog.workflow.test.js` with real HTTP and a disposable replica set.

## Disposable browser smoke test

```sh
node tests/browser/run-session-smoke.cjs
```

Run the complete Admin ↔ Employee Task browser workflow with the same disposable launcher:

```sh
node tests/browser/run-session-smoke.cjs --tasks
```

Run the Admin ↔ Employee Quotation workflow:

```sh
node tests/browser/run-session-smoke.cjs --quotations
```

Run the Customer Acquisition → Product Selection → Quotation workflow:

```sh
node tests/browser/run-session-smoke.cjs --catalogs
```

Run the Employee quotation → Admin approval/conversion → delivery workflow:

```sh
node tests/browser/run-session-smoke.cjs --orders
```

Verify normal backend/Vite startup on the already configured local development replica set, using only a new disposable database on that server:

```sh
node tests/browser/run-session-smoke.cjs --orders --configured-mongodb
```

The configured option reads the ignored backend environment privately, requires a loopback writable replica set with sessions, substitutes a uniquely named disposable database, and drops only that guarded database after stopping test processes. It does not restart or reconfigure MongoDB or write fixtures to the configured business database. Use `node ../backEnd/scripts/local-mongodb.cjs start|status` first on the reviewed development machine. Without this flag, the existing fresh-replica-set test behavior remains.

The Order scenario uses the shared Employee quotation form, zero GST and small-value rounding, submits as Employee, approves/converts as Admin, verifies exact saved components/customer/source links in Orders/details, dispatches/delivers/closes with refetch/refresh, retries conversion without duplicates, and uses existing PDF/CSV downloads. It confirms the Employee sees the converted read-only quotation but cannot access Order/conversion APIs or another Employee's quotation. Results are `m4-order-browser-results.json` with a delivered-Order screenshot. The known unrelated Admin Dashboard metrics 500 is recorded separately.

`order.workflow.test.jsx` renders existing Order list/preview, the new detail route and shared status/download/archive actions. HTTP transport is mocked; tests cover frozen/legacy unavailable amounts, allowed transitions, cancellation validation, stale detail responses, failed refresh, pending/duplicate controls, refetching, archive navigation, exports and permission denial. Quotation view tests cover authorized conversion, pending/retry/failure and the created-order link. Real persistence, concurrency, rollback, financial validation and permissions use `backEnd/tests/integration/order.workflow.test.js` against disposable transaction-capable MongoDB.

The Catalog scenario uses the actual shared Customer form to acquire a customer as Employee, verifies the authenticated creator, searches and opens read-only customer details, and browses the read-only Product Catalog. It selects the new customer and an existing product in the quotation form, saves/submits a draft, and verifies Admin visibility. It also exercises Admin Customer create/edit/archive and Product create/edit/delete, including zero price; verifies a product change preserves submitted quotation snapshots; confirms Employee B's approved shared customer visibility; and denies direct Employee Customer update/archive and Product mutations without changing records. Results are written to `m3-catalog-browser-results.json`, with an acquired-customer quotation screenshot. Customer visibility remains shared rather than creator-exclusive. Products retain the existing hard-delete contract and have no model-level active/inactive or GST configuration.

The Quotation scenario creates a multi-product draft through the Employee form, verifies explicit zero GST and small-value half-up rounding, edits the same draft, submits it, and switches to Admin to reject it with a reason. It revises/reopens/resubmits as Employee, verifies that the most recent rejection survives, approves as Admin, and confirms Employee refresh and locked editing. Employee B's direct detail/edit requests must return 404. It also creates/edits an Admin quotation and opens the existing Task list. Results are written to `m2-quotation-browser-results.json`, with an approved-quotation screenshot. Expected ownership denials and the existing Dashboard metrics 500 are recorded separately.

The Task scenario seeds Admin, Employee A and Employee B, then creates and assigns a new task through the existing Admin UI. It logs in as Employee A, opens My Tasks/details, starts and completes the task, returns to verify the list, logs back in as Admin and reassigns through the existing editor. It checks normalized assignee/date prefills and preserved completion status, verifies Employee A loses list/detail access, and verifies Employee B gains access. The expected post-reassignment 404 and known Admin Dashboard metrics 500 are distinguished from unexpected API/browser failures. The report is `m1-task-browser-results.json`; screenshots show completed and reassigned Task details. The original session scenario remains the default.

This launches a new local, single-node MongoDB replica set with WiredTiger, seeds disposable Admin/Employee/customer/product/task/quotation records, starts the actual backend through `npm start`, and starts Vite with environment overrides. Existing `.env` files and configured databases are untouched. The replica set exercises quotation transactions; there is no standalone fallback. The launcher drives an isolated headless Brave profile through Chrome DevTools Protocol, then stops the browser, development servers and disposable MongoDB. Node 22+ supplies the required native `fetch` and `WebSocket`; the verified environment uses Node 24.

Brave defaults to `/Applications/Brave Browser.app/Contents/MacOS/Brave Browser`. Set `BROWSER_PATH` to another Chromium-compatible executable if needed. Local process/network access and an available MongoDB memory-server binary are prerequisites.

The launcher prints the temporary results directory. It contains sanitized JSON results, server logs, Employee landing/profile screenshots and private fixture settings. Test credentials are random; settings/logs/screenshots use mode 0600 and the temporary directory uses mode 0700. Remove the directory after reviewing it.

Checks include both role logins/logout, existing Admin Tasks/Quotations/details/Profile, every visible Employee navigation link, current-user profile, refresh, malformed/forged cached identity, role denial, a forbidden API response preserving the session, login after logout and invalid JWT rejection. It also checks for obsolete Employee/global metrics requests, browser exceptions and authentication-secret exposure. The known Admin Dashboard metrics 500 is reported separately; Dashboard rendering does not assert that its metrics work.

For already running **disposable test services**, the lower-level command accepts a private JSON settings file:

```sh
node tests/browser/session.smoke.cjs /absolute/path/browser-settings.json
```

Its settings contract is:

```json
{
  "frontendUrl": "http://127.0.0.1:5173",
  "backendUrl": "http://127.0.0.1:5000",
  "adminEmail": "admin@worknest-smoke.test",
  "employeeEmail": "employee@worknest-smoke.test",
  "employeeIdentifier": "EMP-SMOKE-EMPLOYEE",
  "password": "generated-test-password-shared-by-both-fixtures",
  "quotationId": "existing-quotation-MongoDB-id",
  "quotationNumber": "QT-SMOKE-001",
  "tempDir": "/absolute/path/to/existing/private-results-directory"
}
```

The Employee must own the quotation. `quotationNumber` and `employeeIdentifier` default to the shown fixture values. The lower-level harness closes its browser; it does not stop externally started services. Both harnesses exit nonzero for unexpected failures. The default scenario verifies routing/session/profile and every current Employee navigation destination; `--tasks` verifies M1 Task integration; `--quotations` verifies M2 Quotation integration; `--catalogs` verifies M3 Customer/Product integration.

For the lower-level Quotation scenario, set `scenario` to `quotations` and provide `employeeBEmail`, `customerName`, `productName` and `roundingProductName`. The latter product must have a catalog price of 0.05. The disposable launcher supplies these values and fixtures automatically.

For the lower-level Catalog scenario, set `scenario` to `catalogs` and provide `employeeBEmail`, `employeeName`, `customerName` and `productName`. Fixtures must use the current central permissions, including Employee `CUSTOMER_CREATE`, and transaction-capable MongoDB. The disposable launcher supplies them automatically.
