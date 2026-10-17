# M3 Customer and Product integration

Implemented and verified, 2026-10-16. Existing M0/M1/M2 work remains uncommitted; M3 does not start Order or Dashboard work.

## Verified baseline and scope

| Area | Existing behavior | Verified gap / M3 work |
|---|---|---|
| Customer APIs | Shared authenticated nondeleted list; Admin business-code update/archive; creator relationship | POST and GET details unmounted, validation empty; add CC-1 through same resource API |
| Customer permissions | Both roles read; Admin update/archive | Grant Employee CUSTOMER_CREATE through existing central map only |
| Customer UI | Shared Admin table/form/filter/hook/API; obsolete Employee code unmounted | Creator chooser conflicts with authenticated creation; no detail view, role guards, reliable pending/error/refresh states; reuse shared components |
| Product APIs | Shared read; Admin multipart create/update and hard delete | Permissions already correct; preserve backend and hard-delete convention |
| Product UI | Shared Admin cards/filter/form/hook/API | Mutation controls unconditional; add Employee read-only capability display plus loading/error/retry/search |
| Quotation integration | M2 shared selectors already call authorized Customer/Product endpoints; stored historical line snapshots | Verify newly acquired customer is fetched on quotation-page entry and is usable in unchanged draft/submit/review workflow |
| Company boundary | No company/organization identity field exists in these models | Retain shared nondeleted Customer visibility; do not invent creator-exclusive or tenant access rules |

The four approved architecture contracts, M1 Task and M2 implementation/runtime reports were inspected. Customer status/companyType are existing strings; the UI recognizes active/inactive and dealer/doctor. Product has no status, soft-delete, category or tax configuration. There is no supported Product inactive toggle to integrate; hard-deleted products disappear from catalog/selection, and historical quotation snapshots survive.

## M3.1 — Customer API and permissions

Add shared POST `/api/customers` with CUSTOMER_CREATE and GET `/api/customers/:customerId` with CUSTOMER_READ. The detail parameter is the existing business code (`CUST…`), not the quotation selector's customer ObjectId. List remains a raw array; details returns a raw safe Customer; create returns 201 `{message,customer}`. Existing Admin PUT/DELETE routes/envelopes remain.

The authenticated User controls `addedBy`; customer number, request metadata, deletion and creator/audit fields cannot be set through the body. A nonblank name is required because the existing shared customer form already requires it and selection/details need an identifiable customer. Optional address/contact/GST/email remain optional text, including blank; supplied nonblank email is syntax-validated. No new phone/GST format or mandatory contact/address is invented. New omitted status/companyType default to active/dealer; new status accepts active/inactive. Company type remains extensible optional text (including a supplied blank), retaining dealer/doctor and legacy values.

The existing exact-email duplicate policy is retained across active/archived records, without case-folding, automatic restoration or a new unique-email migration. Creation takes its existing customer sequence-counter write inside a transaction before the email lookup, serializing concurrent API creates. Existing Admin update semantics are preserved; this does not add global email uniqueness enforcement to every legacy write path.

Optional `Idempotency-Key` adds retry safety without requiring a new field from existing external callers. Two hidden optional metadata fields plus a partial unique index on authenticated creator/request key protect repeated requests; legacy records without the key are excluded from the index and need no backfill. Same key and canonical payload replays the same nonarchived customer; changed payload or an archived replay is 409. The shared form sends a stable key for unchanged retries and changes it for a new form/payload. Requests without a key retain email duplicate checks; repeated name-only requests without a key cannot be distinguished from intentional separate customers.

Before persistence changes, the exact configured development connection passed read-only D8 preflight: `worknest-dev`, writable PRIMARY, logical sessions. No existing Customer contained the proposed request key metadata, so the partial unique index had no existing candidate collisions. The shared standalone service/configuration and application environment are unchanged. Customer transactions reuse existing Mongoose/MongoDB support and the sequence helper with an optional backwards-compatible session argument; no dependency upgrade is needed.

Focused group result: 46 tests passed across the Customer service/controller and new real HTTP/MongoDB integration suites, including 30 actual HTTP cases. Concurrent same-key attempts created one Customer, different-key duplicate-email attempts produced one success, and injected failure after an actual Customer write rolled back both Customer and counter. Changed backend lint/syntax/whitespace passed. Existing customerId counter was read-only verified aligned with the maximum existing numeric customer suffix; no reset or business-code repair was needed.

## M3.2 — Shared Customer UI

Route/navigation integration adds Employee `/employee/customers`, `/employee/customers/:customerId` and additive Admin detail routes, protected by CUSTOMER_READ. Existing Admin list address remains unchanged. Creation uses the shared existing modal rather than a duplicate Employee form. Employee update/archive remains forbidden.

The existing CustomerManagement, table, modal, filters, API and hook are reused. The obsolete Employee/creator chooser is removed; only supported contact/classification data is sent. Accessible inputs, safe legacy category/status display, pending guards, stable retry keys, errors retaining entered data, loading/empty/error states, search/status/category filtering, manual/focus refresh and request race guards now work. The new shared Details page is read-only, safely shows actual creator/dates and omits unavailable optional data.

Focused group result: 23 Customer UI tests passed, including Admin edit/archive regression, retry/duplicate-click behavior, no creator payload, error/filter states, stale detail routes and missing optional fields. Customer module/test lint and whitespace passed.

## M3.3 — Shared Product Catalog

Shared ProductManagement, ProductGrid/Card/Filters and useProducts are retained. The existing initialized session and exact permissions control Admin mutation actions; Employee gets Product Catalog with no Add/Edit/Delete controls. Existing code, image, name, description and current price are shown; unsupported tax/category/status fields are not fabricated. Search uses existing components and includes code/name/description. Refresh/focus revalidation, request race protection, loading/error/retry and empty states are added. Admin modal/business-code APIs remain, with pending/error handling and valid zero-price/file submission handling.

Image-less/failed-image products use an existing icon placeholder instead of requesting the absent `/fallback.png` asset. No new image dependency or generated asset is introduced.

Focused group result: 20 Product UI/hook tests passed; changed-file lint and whitespace passed. Product backend/model/permissions are unchanged.

## M3.4 — Acquisition to quotation and regression verification

The existing M2 quotation form already fetches shared Customer/Product services on page entry. Actual Employee acquisition → navigation to quotation creation fetched the new customer, selected existing products, saved and submitted the same draft, and exposed it to Admin. No Quotation pricing, approval, persistence or selector source changes were required in M3. Admin updates/deletion of catalog records did not change saved item names/prices/discount/GST/totals. Customer information remains an existing live reference rather than a newly invented historical snapshot.

Verification uses disposable replica-set databases and generated Admin/Employee A/Employee B accounts. Existing development business records are not used as test fixtures. Existing M1/M2/session browser scenarios remain regression checks. No quotation pricing, approval or persistence change is planned.

## M3 file inventory

All earlier milestone changes remain in the workspace; not every dirty file belongs to M3.

- Backend Customer: `backEnd/src/modules/customer/customer.model.js`, `customer.repository.js`, `customer.service.js`, `customer.controller.js`, `customer.routes.js`, `customer.validation.js`.
- Shared backend helpers: `backEnd/src/utils/rolePermissions.js`, `backEnd/src/utils/getNextSequence.js` (optional session only).
- Backend tests: `backEnd/tests/unit/customer.service.test.js`, `customer.controller.test.js`; new `backEnd/tests/integration/customer.catalog.workflow.test.js`.
- Shared Customer frontend: `frontEnd/src/modules/customer/pages/CustomerManagement.jsx`, new `pages/CustomerDetails.jsx`, `components/CustomerModal.jsx`, `CustomerFilters.jsx`, `CustomerTable.jsx`, `hooks/useCustomers.js`, `services/customer.api.js`, `customer.util.js`.
- Shared Product frontend: `frontEnd/src/modules/product/pages/ProductManagement.jsx`, `components/ProductCard.jsx`, `ProductFilters.jsx`, `ProductGrid.jsx`, `hooks/useProducts.js`.
- Routing/navigation: `frontEnd/src/routes/EmployeeRoutes.jsx`, `AdminRoutes.jsx`, `frontEnd/src/shared/navigation.js`.
- Frontend tests: new `frontEnd/tests/customer.integration.test.jsx`, `product.catalog.test.jsx`; updated `employee-session.test.jsx`.
- Actual browser tests: `frontEnd/tests/browser/run-session-smoke.cjs`, `session.smoke.cjs`, `frontEnd/tests/README.md`.
- Documentation: this report, `docs/architecture/api-contracts.md`, `roles-permissions.md` (implemented deltas), root `README.md`.

No Product backend/schema, Quotation source, Order or Dashboard files were changed for M3. No new dependencies or lockfile changes were introduced. No commit, merge or staging was performed.

## Executed verification

| Check | Result |
|---|---|
| New real HTTP/JWT/MongoDB Customer/catalog suite | 30/30 passed |
| Focused Customer backend group with service/controller units | 46/46 passed |
| Full backend suite | 423 passed / 1 pre-existing failure; 21/22 suites passed |
| Customer UI | 23/23 passed |
| Product UI | 20/20 passed |
| Full frontend suite | 158/158 passed; 7/7 suites passed |
| M3 actual browser workflow | 14/14 passed |
| M2 actual browser regression | 11/11 passed |
| M1 actual browser regression | 9/9 passed |
| Session/navigation/profile actual browser regression | 18/18 passed |
| Changed-file backend/frontend lint | Passed; backend 11 files, zero errors/warnings |
| Whole frontend lint | 13 existing errors / 2 warnings in untouched files; not repaired |
| Frontend production build | Passed, 1845 modules; existing duplicate-button-key and large-chunk warnings |
| Browser/backend syntax and final whitespace | Passed |

Backend full regression used `node node_modules/jest/bin/jest.js --config tests/jest.config.js --runInBand --coverage=false --cache=false --silent` from `backEnd`. The only failure remains `tests/unit/order.service.test.js:100`, `generateOrderPdf.mockResolvedValue is not a function`. All authentication, authorization, profile, Task, Quotation and Customer/catalog suites passed.

Frontend ran `npm test -- --runInBand --coverage=false` and `npm run build -- --outDir /private/tmp/worknest-m3-build`. Changed Customer/Product/navigation/routes/tests were linted separately. The backend has no applicable Node compile/type-check target; actual runtime/HTTP and Node syntax were verified. No unrelated lint/build/test failure was fixed.

Actual browser commands from `frontEnd`: `node tests/browser/run-session-smoke.cjs --catalogs`, `--quotations`, `--tasks`, and the default scenario. Each launched real `npm start`, Vite and Brave/CDP using a fresh disposable replica set and generated fixture accounts. All **52 checks passed** with no JavaScript exceptions, authentication-secret findings, obsolete Employee APIs or unexpected authorization failures. M3 explicitly verifies shared Customer visibility for Employee B, five denied Employee mutations with unchanged records, no creator override, current Product read-only controls, Admin Customer/Product CRUD, and no missing-image fallback requests. The known Admin Dashboard metrics 500 was recorded separately; Dashboard rendering does not imply working metrics.

Some initial browser harness attempts inspected headers/nav before asynchronous data/session hydration completed. Appropriate data/title/active-navigation waits and explicit archive confirmation were added; affected scenarios were rerun successfully. Temporary browser/server/database processes were cleaned up. No existing development business record was used or changed by these tests.

Sanitized local browser reports (temporary artifacts, not Git files):

- M3: `/private/var/folders/kw/ctk1tq0s1ts_wt6c90x064t00000gn/T/worknest-session-smoke-Lp2IYy/m3-catalog-browser-results.json`.
- M2: `/private/var/folders/kw/ctk1tq0s1ts_wt6c90x064t00000gn/T/worknest-session-smoke-dj5lsh/m2-quotation-browser-results.json`.
- M1: `/private/var/folders/kw/ctk1tq0s1ts_wt6c90x064t00000gn/T/worknest-session-smoke-bv7y7x/m1-task-browser-results.json`.
- Session/navigation: `/private/var/folders/kw/ctk1tq0s1ts_wt6c90x064t00000gn/T/worknest-session-smoke-t5BWmY/issue3-browser-results.json`.

## Definition of Done and remaining limits

M3 meets its scoped Definition of Done. Employee acquisition, authenticated creator identity, shared Customer list/details, read-only Product Catalog, Admin management, new Customer/Product references in quotations, and authorization/ownership regressions passed automated and actual browser checks.

Existing conventions remain explicit: Customer reads are shared across creators, inactive customers remain readable but cannot be newly selected/submitted for quotations, Product archive is hard deletion, Product has no status/category/tax setup, and Customer information is live rather than a historical snapshot. Backend optional fields remain optional; no new phone/GST validation policy is invented. Retry deduplication requires key reuse; the shared UI does so, while new/cancelled/reloaded forms are new intents. Existing Admin email-update checks are unchanged and are not a new global unique-email guarantee. Customer `updatedBy` is still not a persisted model field; timestamps and original `addedBy` remain the existing audit contract.

Known unrelated issues remain the Admin Dashboard metrics 500, Order PDF mock, and whole-project lint/build warnings above. Existing Product image-file cleanup paths and broad direct Admin Product-input validation were not expanded in this integration. The Employee landing page's pre-existing copy still describes Customers/Products as a later update; its new navigation destinations work, but the Dashboard source was deliberately left untouched under the explicit scope boundary. No Order, Dashboard, inventory or tax-engine work was begun.

No commits or merges were made. Stop after M3 for user review.

