# M4 Quotation to Order and fulfillment integration

Implemented and verified 2026-10-17. The [initial Order audit](order-integration-audit.md) preceded runtime edits. The user explicitly approved its three business/data decisions: the minimal fulfillment lifecycle, preservation of legacy Orders with uniqueness for newly marked conversions, and conversion-time Customer snapshots. M0–M3 changes remain in the working tree alongside M4. Nothing is staged, committed or merged.

## Result and implementation groups

| Group | Verified gap and resulting behavior |
|---|---|
| M4.1 Conversion/persistence | No mounted conversion or working direct creation API existed. Added Admin `POST /api/quotations/:quotationId/convert` using the current Order service, quotation repository transaction helper and Order counter. Only APPROVED quotations convert; server loads every source value. Order, sequence and CONVERTED quotation commit together or roll back together. |
| M4.2 Admin UI/fulfillment | Reused OrderManagement, cards, list, filters, preview, hook and API wrappers. Added business-code Order Details, complete frozen commercial/customer information, source link, refresh/retry/pending states and permitted status actions. Shared quotation details now expose authorized conversion and a created-order link. No Employee Order routes/navigation were added. |
| M4.3 Integrity/authorization | Added conversion-only partial uniqueness, checks of every existing Order link including archived records, strict conversion/status bodies, stored-component validation, authenticated audit identity, state/version-conditional status/archive writes and independent Admin checks. Employee Order/conversion/export requests remain forbidden under D3. |
| M4.4 Existing exports | Fixed the actual PDF export/function/response mismatch. The existing PDFKit generator now returns a Buffer; controller sends the attachment. PDF/CSV share stored Order rows, preserve legacy unavailable amounts, and never consult current Product prices. CSV quotes embedded commas/quotes/newlines and neutralizes formula prefixes. No template branding or new dependency was added. |
| M4.5 Verification | Real HTTP/replica-set tests, both-role browser workflows, prior milestone browser regressions, full unit/integration suites, lint, build, startup, historical-data and Git checks executed as recorded below. |

No supported direct Order creation API was removed. The obsolete unmounted Employee handler stays unmounted. New Orders have `sourceType: quotation_conversion`; old unmarked Orders remain recognizable as legacy records.

## Snapshot and compatibility contract

- Product identity/name/SKU/description, quantity, unit price, discount percentages/amounts, GST rate/amount, taxable amount, line total and header components are copied from persisted approved quotation data. Existing `price`, `totalSnapshot`, customer/products snapshot structure and business `orderId` remain compatible. Conversion never calls live Product pricing or rewrites source items.
- Customer details are frozen from the linked document at conversion time, as approved. An existing archived Customer is allowed; a missing Customer returns 409 requiring review. This does not claim to reconstruct approval-time Customer information. Later Customer/Product edits or deletion cannot change the saved Order.
- Stored monetary components must be finite, nonnegative, representable cents and internally consistent. Headers must equal exact scaled sums of stored line components. Conversion returns 409 for inconsistent historical data without repairing it. Historical unit-price precision remains exact when saved components are consistent; the regression includes `100.005`. Current tax/discount formulas are not reapplied to approved records.
- New conversion numbers use existing `order` sequence / `ORD` plus minimum three digits. The development preflight confirmed sequence 3, highest existing suffix 3. A conflicting number causes complete rollback and 409 for review; no automatic counter repair occurs.
- A partial unique `{quotationId: 1}` index applies only to `sourceType: quotation_conversion`, including archived marked records. The new marker had **zero existing candidates** before implementation. This preserves the three historical duplicate links; no global unique constraint, deduplication, backfill or historical rewrite was applied.
- Conversion checks all existing Orders, including unmarked/archived records. A consistent active new conversion replays as 200 with the same Order; the first conversion returns 201. Legacy, archived or inconsistent existing links return 409 and cannot produce another Order. Concurrent conversions serialize through the quotation header write and transaction retries; the index independently protects the new cohort.
- Existing ORD001–ORD003 share one missing source quotation. Their stored customer/product/price/quantity/total values remain readable; absent discount/GST/line components display `Unavailable`. No fabricated zeros or replacement quotation are created. The archived Order remains archived. Their full document fingerprint matched before/after implementation.

## Approved fulfillment rules

```text
new conversion → confirm
pending → confirm → dispatched → delivered → closed
pending / confirm → cancelled (reason required)
```

There are no skipped/backward transitions, reopening or manufacturing states. Cancellation is forbidden after dispatch. `closed` records administrative completion after delivery and does not record payment or received revenue. Unknown legacy statuses remain readable and offer no transitions.

The backend returns `allowedTransitions` from its shared validation table. UI actions send the current `expectedStatus`; the backend independently checks the current document and uses status/timestamp/version-conditional updates. Stale writes return 409. Cancellation records trimmed reason, authenticated actor and timestamp; dispatch/delivery/closure record their dates. Existing Admin archive permission remains available without an invented status restriction. Archived details/exports return 404, and archiving does not free a quotation for another conversion.

## Files in this milestone

Earlier milestone files are also dirty; this is the M4 inventory, rather than an attribution of the entire Git diff.

- Backend: `backEnd/src/modules/order/order.model.js`, `order.repository.js`, `order.service.js`, `order.controller.js`, `order.routes.js`, `order.validation.js`; small conversion additions to `backEnd/src/modules/quotation/quotation.controller.js` and `quotation.routes.js`.
- Exports: `backEnd/src/utils/pdf/orderPdfGenerator.js`, `csv/orderCsvGenerator.js`, new `orderExportRows.js`.
- Backend verification: new `backEnd/tests/integration/order.workflow.test.js` and `tests/unit/order.exports.test.js`; updated `tests/unit/order.service.test.js`, `order.controller.test.js`; existing `tests/integration/authorization.security.test.js` Admin fixture now follows pending → confirm → dispatched instead of skipping confirmation.
- Frontend: existing `frontEnd/src/modules/order/components/OrderCard.jsx`, `OrderFilters.jsx`, `OrderList.jsx`, `OrderPreviewCard.jsx`, `OrderPreviewPanel.jsx`; `hooks/useOrders.js`, `order.util.js`, `pages/OrderManagement.jsx`, `services/order.api.js`; new shared `components/OrderActions.jsx`, `pages/OrderDetails.jsx`; additive route in `frontEnd/src/routes/AdminRoutes.jsx`.
- Shared quotation integration: `frontEnd/src/modules/quotation/quotation.access.js`, `services/quotation.api.js`, `pages/quotationDetails/components/QuotationWorkflowActions.jsx`.
- Frontend verification: new `frontEnd/tests/order.workflow.test.jsx`, updated `quotation.views.test.jsx`, browser `run-session-smoke.cjs` and `session.smoke.cjs`, test README.
- Documentation: this report, the approval update to the initial audit, implemented API/workflow/permission deltas and README links. No package, lockfile, environment or shared MongoDB configuration changes belong to M4.

## Executed verification

| Check | Final result |
|---|---|
| New real HTTP/MongoDB Order workflow suite | **68/68 passed** |
| Full backend after final financial guard | **525/525 passed, 24/24 suites**; previously failing Order PDF test now passes |
| Full frontend | **183/183 passed, 8/8 suites** |
| Focused rendered Order/quotation views | **48/48 passed** |
| Actual M4 browser on configured replica set | **12/12 passed**, rerun successfully after final validation change |
| Actual previous milestone browser regressions | **52/52 passed**: Tasks 9, Quotations 11, Customer/Product 14, session/navigation 18 |
| Changed backend/frontend ESLint | Passed; Node/CommonJS/Jest globals supplied for backend and frontend's existing configuration used for frontend |
| Whole frontend lint | **Fails: 12 existing errors / 2 warnings in untouched files**, recorded separately below |
| Frontend production build | Passed; existing duplicate `cta` key / >500 kB chunk warnings remain |
| Normal backend startup on exact configured database | Passed; protected Task/Quotation/Order/Customer/Product APIs returned 401; approved partial unique index initialized successfully with the three legacy Orders intact |
| Configured MongoDB / original shared instance | `worknest-dev` writable PRIMARY with sessions; original standalone data/counts/hashes/indexes/configuration/LaunchAgent unchanged |
| Historical quotation review | 11 nonarchived quotations checked, including all 5 APPROVED; **0 stored-pricing review findings**; no business writes |
| Syntax / whitespace / Git safety | Passed; staged index empty; environment/private backup/data/config tree excluded; no dependencies or lockfiles changed |

Backend command from `backEnd`:

```sh
node node_modules/jest/bin/jest.js --config tests/jest.config.js --runInBand --coverage=false --cache=false --silent
```

Frontend commands from `frontEnd`:

```sh
npm test -- --runInBand --coverage=false
npm run build -- --outDir /private/tmp/worknest-m4-frontend-build
node tests/browser/run-session-smoke.cjs --orders --configured-mongodb
node tests/browser/run-session-smoke.cjs --tasks
node tests/browser/run-session-smoke.cjs --quotations
node tests/browser/run-session-smoke.cjs --catalogs
node tests/browser/run-session-smoke.cjs
```

The existing CommonJS backend has no applicable compile/type-check command; its declared react-scripts build does not build this Node application. Syntax, real startup/HTTP and automated tests were used instead. No OS reboot or remote production deployment is claimed.

The new HTTP suite verifies exact snapshots/zero GST/rounding, invalid states/references/payloads, Admin and Employee permissions, idempotent and concurrent conversion, partial unique compatibility with legacy duplicates, archived-link blockers, real rollback after Order and quotation writes, stale/concurrent fulfillment and archive, cancellation audits, subcent rejection without mutation, retained historical precision, live-record deletion and actual PDF/CSV bytes.

Actual headless Brave checks create/submit as Employee, approve/convert as Admin, open list/details/source links, dispatch/deliver/close, refresh, retry conversion, use PDF/CSV controls, inspect downloaded bytes, view the converted quotation as Employee and deny Employee Order/conversion access. No browser JavaScript exceptions, authentication-secret findings or obsolete API calls occurred. Screenshot inspection confirmed the stored customer/line/component totals and fulfillment information.

Final browser reports are private temporary files under `/var/folders/kw/ctk1tq0s1ts_wt6c90x064t00000gn/T/`:

- `worknest-session-smoke-9xybtY/m4-order-browser-results.json`, with `m4-delivered-order.png`.
- `worknest-session-smoke-hlUdUf/m1-task-browser-results.json`.
- `worknest-session-smoke-eZA29D/m2-quotation-browser-results.json`.
- `worknest-session-smoke-QhMz9w/m3-catalog-browser-results.json`.
- `worknest-session-smoke-NHb61a/issue3-browser-results.json`.

## Runtime, deployment and recovery

The normal startup procedure is unchanged: `node backEnd/scripts/local-mongodb.cjs start|status`, then backend `npm start` and frontend `npm run dev`. The exact ignored development connection still selects the previously approved loopback replica set. No shared Homebrew service restart/configuration change or application environment edit was made. [D8 lifecycle/recovery](quotation-d8-verification.md) remains authoritative after a development machine restart; the helper is manually invoked and does not register automatic boot services or provision fresh clones.

`--configured-mongodb` validates the local configured replica set, then creates a uniquely named **disposable database on that same server**. It uses normal backend/Vite scripts with database-name, random JWT and available-port overrides, and drops only that guarded disposable database after stopping test services. Existing business data is never a browser fixture. The default launcher continues using a fresh disposable replica set. The real configured development database was separately started normally, including successful partial-index initialization and protected-route checks. Three legacy documents remained byte-for-byte unchanged; original shared standalone manifests/configuration also matched the D8 backup. No browser test process/database was left running; the pre-existing WorkNest replica-set service remains available.

Other environments must provide the same verified transaction-capable topology and build the partial unique index before enabling conversion. Mongoose's existing development auto-index behavior installed it successfully here; an environment with `autoIndex` disabled must explicitly apply the reviewed index. Preflight marked duplicate links and order-counter alignment before deployment; do not replace this partial index with a failing global unique constraint or reset existing counters. There is no standalone/partial-write fallback. Test writes and rollback tests belong in disposable databases. Any historical pricing inconsistency returns 409 for explicit review, never automatic repair.

Private local capability/fingerprint/index/startup/pricing reports are under ignored `.worknest-local/reviews/m4-*20261017*`, mode 0600. They contain no staged artifacts. The development Order schema change is additive apart from explicit backend transition enforcement; no business migration or destructive rollback is needed to preserve legacy records. Reverting application code does not require deleting Orders, source snapshots, database backups or the partial index. Never restore old business data over later accepted Orders as a routine code rollback.

## Remaining limits and Definition of Done

M4 meets its scoped Definition of Done. Approved quotations convert once, atomic rollback/retries and immutable snapshots are verified, Admin Order details/fulfillment work, Employee restrictions persist, and full automated/actual browser workflows passed.

Known unrelated issues remain the Admin Dashboard metrics 500 and whole-project frontend lint errors: AdminDashboard, useEmployees, dormant EmployeeOrderManagement/EmployeeQuotationManagement, ActionButton, Section, VariantButton and CustomerComboBox. Those files were not changed to repair unrelated warnings. Existing duplicate VariantButton `cta` and bundle-size build warnings remain. The three dangling/duplicate legacy quotation links and their missing commercial components require separately reviewed data reconciliation if historical completeness is needed.

Product hard deletion remains unchanged: no cascade removes commercial records, quotation population retains missing product IDs, and Order details/exports read snapshots. Image recovery/soft-archive policy is a separate follow-up; no Inventory/Product rewrite occurred. Employee Order ownership, manufacturing, shipping, invoicing/payment, Dashboard/reporting and M5 remain out of scope. No commits or merges were made. Work stops after M4 for review.
