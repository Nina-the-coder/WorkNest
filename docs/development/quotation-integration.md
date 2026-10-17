# M2 Quotation integration

Implemented and verified, 2026-10-16. Existing M0/M1 changes remain in the working tree; no commits or merges are made by this milestone.

## Verified implementation and gaps

Both roles already share QuotationManagement, AddQuotation, QuotationDetails, selectors, item components, API wrappers and the quotation backend. M0 ownership checks and locked-state validation exist. Those pieces are retained.

Verified gaps are duplicate option requests including an unauthorized Employee-directory fetch; stale form/detail state; missing loading/error/retry handling; unguarded review buttons; action hooks that do not refresh their owning details; stale filtered list counts; independent floating-point pricing; zero-GST substitution; product snapshot replacement from live catalog data; incomplete submission validation/metadata; clearing the last rejection on reopen; and nontransactional header/item replacement with racing transitions. Order conversion has no mounted operation and remains outside M2.

## Implementation order and gate

1. Repair shared frontend loading, permissions, route-state handling, read-only stored-value details and refetch behavior. Retain saved draft identity if a later submit request fails. These fixes do not require changing quotation persistence.
2. Resolve the approved D8 topology gate, then implement the approved scaled/half-up pricing and validation contract, historical snapshot preservation, latest-rejection retention, submission metadata and atomic persistence/workflow checks in a related backend group.
3. Validate both roles with focused frontend tests, real MongoDB HTTP/failure/concurrency tests and actual browser workflows; retain Admin and M1 regressions.

D8 passed before persistence changes. The original local MongoDB 8.2.2 service was shared and standalone, so it was preserved. With explicit approval, a separate loopback replica set was created on port 27018. The backup was restored and all eight collection counts, content hashes and indexes matched. Transaction commit, complete rollback, original-data integrity and existing Admin Task/Quotation HTTP checks passed. Only WorkNest's ignored backend environment connection changed. See [verified setup, lifecycle and recovery](quotation-d8-verification.md).
No Customer Creation, Order implementation, Dashboard repair or full quotation history is included.


## Resulting behavior and compatibility

Both roles use the existing routes, quotation services, selectors, forms, list, details and action endpoints. No new permission architecture or role-specific business backend was added. Existing Admin assignment/archive behavior remains. Employee ownership derives from authenticated User; forbidden transfer requests are rejected, while creator/status/number/total payload fields remain excluded by the controller. Backend locks submitted/approved/converted records.

Customer and Product selection now handle loading/errors/retry without Employee directory requests. Draft editing resets correctly across routes, retains quotation identity and preserves a saved draft when a later submit fails. Details are read-only, display stored line/header values, distinguish creator from owner, and show the latest rejection with reviewer/date. List and detail action callbacks refetch their owning data and filtered counts. The existing placeholder PDF/conversion controls are omitted because no corresponding operation exists; approved quotations are identified as ready for the separately scoped conversion integration.

Backend validation enforces commercially complete drafts, real permitted customer/new-product/owner references, duplicate prevention, meaningful numeric types, safe bounds and supplied future validity. API validity remains optional; the existing shared form requires it. Pricing uses exact decimal/scaled half-up cents and positive-percentage discount precedence before GST. Omitted new GST defaults to 18; explicit zero and stored historical rates are preserved. Rates retain the existing Number storage precision without a new two-decimal rate restriction. Monetary JSON fields remain numbers and reject values that cannot preserve cents in that representation.

Existing line snapshots and unchanged commercial values survive ordinary full-form saves, including catalog removal and legacy rounding. Explicit commercial edits use the approved current calculation; headers aggregate stored line components. Metadata-only edits do not recalculate old totals. Inconsistent historical drafts require explicit commercial review/revision before submission; no historical migration or silent line-price repair was performed. Approved data is never repriced.

Header/item create and replacement are transactional. Detail reads use a consistent transaction snapshot; list/count reads also share a snapshot. Header updates include current status, owner, timestamp and authorized scope, so conflicting transactions reload and recheck state. Populations run serially within the session. Failed item writes roll back the entire header/item change. Sequence allocation can leave number gaps on a failed/retried save but never reuse a quotation number. Submission records optional submittedBy/submittedAt; legacy records are not assigned fabricated submission dates. Reopen/resubmit/approval retain the latest rejection fields, replaced only on a later rejection.

## M2 file inventory

Earlier M0/M1 changes remain uncommitted in this workspace. This list identifies the M2 implementation and its supporting verification, rather than attributing every dirty file to M2.

- Backend quotation module: `backEnd/src/modules/quotation/quotation.controller.js`, `quotation.model.js`, `quotation.repository.js`, `quotation.service.js`, `quotation.validation.js`, new `quotation.pricing.js`.
- Backend verification: new `backEnd/tests/integration/quotation.workflow.test.js`, new `backEnd/tests/unit/quotation.pricing.test.js`, adapted `backEnd/tests/unit/quotation.service.test.js` and `quotation.routes.test.js`; `backEnd/tests/integration/identity.security.test.js` and `authorization.security.test.js` now use disposable replica sets for transactional quotation requests.
- Shared form: `frontEnd/src/modules/quotation/pages/addQuotation/AddQuotation.jsx` and its `components/CustomerInformation.jsx`, `CustomerSelector.jsx`, `EmployeeSelector.jsx`, `ProductCard.jsx`, `ProductSelector.jsx`, `ProductTableRow.jsx`.
- Shared listing: `frontEnd/src/modules/quotation/pages/QuotationManagement.jsx`, `components/QuotationCard.jsx`, `components/QuotationTable.jsx`, `constants/quotation.constants.js`, `hooks/useQuotations.js`.
- Shared details: `frontEnd/src/modules/quotation/pages/quotationDetails/QuotationDetails.jsx` and its `components/QuotationCompanyHeader.jsx`, `QuotationCustomerSection.jsx`, `QuotationDetailsHeader.jsx`, `QuotationItemsTable.jsx`, `QuotationPreview.jsx`, `QuotationWorkflowActions.jsx`.
- Shared utilities: `frontEnd/src/modules/quotation/quotation.util.js`, new `quotation.access.js`.
- Frontend verification: new `frontEnd/tests/quotation.form.test.jsx`, `quotation.pricing.test.jsx`, `quotation.views.test.jsx`; `frontEnd/tests/browser/run-session-smoke.cjs`, `session.smoke.cjs`, and `frontEnd/tests/README.md`.
- Local D8 support: `.gitignore`, new `backEnd/scripts/local-mongodb.cjs`, new `docs/development/quotation-d8-verification.md`, this report and the appended implemented API-contract delta. Ignored local `.env` and private `.worknest-local/` are environmental artifacts, not committed source.

## Final verification

| Check | Executed result |
|---|---|
| D8 configured isolated environment | All 8 transaction/HTTP/data-integrity checks passed; original shared service untouched |
| New HTTP/replica-set quotation workflow | 68/68 passed, including races, actual failed-write rollback, references, history, GST defaults and authorization |
| Pure backend pricing | 27/27 passed |
| Full backend suite | 385 passed, 1 failed; 20/21 suites passed |
| Full frontend suite | 111/111 passed; 5/5 suites passed |
| Changed backend source/helper/test ESLint | 14 files, 0 errors/warnings |
| Changed shared quotation/frontend test ESLint | 23 files, 0 errors/warnings |
| Whole frontend lint | 15 pre-existing errors / 2 warnings in untouched files; left unchanged |
| Frontend production build | Passed; 1843 modules; existing duplicate VariantButton key / large-chunk warnings |
| Actual browser M2 | 11/11 passed |
| Actual browser M1 regression | 9/9 passed |
| Actual browser session/Admin regression | 18/18 passed |
| Syntax / whitespace | Changed backend/browser syntax and final git diff --check passed |

Backend tests used `node node_modules/jest/bin/jest.js --config tests/jest.config.js --runInBand --coverage=false --cache=false --silent` from `backEnd`. The sole full-suite failure is the existing `tests/unit/order.service.test.js:100` Order PDF mock (`generateOrderPdf.mockResolvedValue is not a function`), outside M2. All quotation, authentication, authorization, profile and Task suites passed. No unrelated failure was repaired.

Frontend verification used the existing Jest setup and Vite production build; output was `/private/tmp/worknest-m2-frontend-1792165829443`. This CommonJS backend has no applicable compile/type-check pipeline; its declared react-scripts build is unrelated to running the Node backend. Actual backend startup/HTTP and Node syntax checks were executed instead.

Actual browser commands from `frontEnd` were `node tests/browser/run-session-smoke.cjs --quotations`, `--tasks`, and the default invocation. They launched real backend/Vite/browser services with disposable replica-set data. Final 38 checks passed with no browser JavaScript exceptions, authentication-secret findings, obsolete Employee requests or unexpected authorization failures. Expected Employee B/reassignment 404 and session denial responses were asserted. The known Admin Dashboard metrics 500 was recorded separately; Dashboard rendering passed, metrics did not.

Final local browser evidence:

- M2 report: `/private/var/folders/kw/ctk1tq0s1ts_wt6c90x064t00000gn/T/worknest-session-smoke-qGrzv1/m2-quotation-browser-results.json`; screenshot `m2-admin-approved-quotation.png` in that directory.
- M1 report: `/private/var/folders/kw/ctk1tq0s1ts_wt6c90x064t00000gn/T/worknest-session-smoke-VkSEVR/m1-task-browser-results.json`.
- Session/Admin report: `/private/var/folders/kw/ctk1tq0s1ts_wt6c90x064t00000gn/T/worknest-session-smoke-JEBOnu/issue3-browser-results.json`.

Early browser harness attempts needed waits for asynchronous form mounting and an exact employee option match. They were corrected and all scenarios rerun successfully. Disposable services/databases were cleaned up after each run. Existing development business records were not used as test fixtures.

## Definition of Done and remaining limits

M2 meets its scoped Definition of Done: Employee listing/creation/draft editing/submission, shared Admin review, retained rejection/revision/resubmission, ownership/locked-state enforcement and both-role synchronization were verified through automated and actual browser tests. Existing Admin quotation and Task workflows passed. No runtime failures introduced by M2 remain known.

Known unrelated failures remain the Admin Dashboard metrics 500, Order PDF test mock and whole-project frontend lint findings above. Order conversion, CC-1, Dashboard enhancements and full version history remain separately scoped. Legacy inconsistent draft commercial data requires explicit review/revision before submitting; approved historical data is untouched. Only local development topology was verified; this record does not establish another deployment's transaction support.

The isolated local WorkNest MongoDB remains running, with graceful management through `node backEnd/scripts/local-mongodb.cjs start|status|stop`; original shared service/data/configuration are preserved. Startup after reboot, shutdown, private backup, recovery and cleanup instructions are in the D8 report. No commits or merges were made; all changes remain ready for user review. Work stops after M2.


## Final runtime compatibility review

The subsequent [normal startup, configured-database and restart review](m2-runtime-compatibility.md) passed. It includes 22 actual browser checks against the normal development application before/after an isolated database restart, unchanged original shared data/configuration, a read-only scan of 12 legacy quotations with no pricing-review findings, and an empty Git index/private-file exclusion check. One narrow percentage-discount comparison correction and its regressions passed 122 focused backend and 113 frontend tests. Those newer focused results supersede the affected earlier test counts above; the earlier full-backend failure remains a separately recorded baseline result. No actual OS reboot or production deployment verification was claimed.
