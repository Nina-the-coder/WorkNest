# M1 Admin and Employee Task integration

The existing Task model, Admin page, shared API client, JWT identity and central permission map are retained. The [implemented API delta](../architecture/api-contracts.md#implemented-delta--m1-task-integration) records the final contract. This report describes M1, not Employee Quotation integration.

## Gaps resolved

- Employee Task UI used unmounted `/api/employee/tasks` paths, exposed invalid cyclic status/delete controls and had no shared detail route.
- The shared Task hook fetched the Admin-only Employee directory for every task list. It hid fetch failures and had no public refresh operation.
- Employee writes were intentionally blocked in M0. Task validation was empty; writes did not enforce a conditional assignment/status snapshot.
- The Admin edit form copied populated assignee objects and full ISO timestamps into scalar/date inputs, did not prefill its selector, and omitted existing status/priority editing capabilities. Save failures/pending requests lacked usable feedback.

## Shared behavior

Employee My Tasks and details use the same Task records and services as Admin. TaskCard is reused with a View task action; existing Admin Edit/Delete callbacks remain. The existing hook now supplies shared list/detail fetching, refresh and mutation handling without reading the Employee directory. Existing Header, layouts, permission guards, SkeletonLoader and EmployeeComboBox are reused.

Employee status changes use the dedicated PATCH action and only `TASK_STATUS_UPDATE`. Existing full Admin PUT remains protected by `TASK_UPDATE`. Employee transitions are `pending → in-progress → done`, with harmless current-status retries; only Admin can reopen or choose other valid enum transitions. Status changes cannot carry assignment, title, date, priority or other administrative fields.

Writes match the current assignee/status/update timestamp and exclude deleted records. An intervening edit or reassignment cannot be overwritten using the earlier snapshot; revoked access returns 404, and a still-visible conflict returns 409. The UI refetches after conflicts. This is a single-document conditional write and requires no Task schema migration or multi-document transaction.

Admin reassignment preserves status. Newly selected assignees are validated active Employee users; historical unchanged references still support Admin edits. The UI normalizes existing assignee/date values and offers active Employee options for Task assignment. Other EmployeeComboBox consumers retain their default role scope.

Synchronization uses mutation refetch, page navigation, manual refresh and window focus. It does not promise live push updates. Returning to My Tasks fetches the current persisted status; revoked details clear their prior data. Completed tasks offer no Employee reopening control.

## Files changed in M1

| Area | Files |
|---|---|
| Backend permissions | `backEnd/src/utils/permissions.js`, `rolePermissions.js` |
| Shared Task backend | `backEnd/src/modules/task/task.routes.js`, `task.controller.js`, `task.service.js`, `task.repository.js`, `task.validation.js` |
| Backend tests | `backEnd/tests/integration/task.workflow.test.js` (new), `tests/unit/task.service.test.js`, `task.controller.test.js` |
| Shared Task frontend | `frontEnd/src/modules/task/services/task.api.js`, `hooks/useTasks.js`, `task.util.js`, `components/TaskCard.jsx`, `TaskModal.jsx`, `TaskDetails.jsx` (new) |
| Task pages | `frontEnd/src/modules/task/pages/TaskManagement.jsx`, `EmployeeTaskManagement.jsx`, `EmployeeTaskDetails.jsx` (new) |
| Navigation/assignment | `frontEnd/src/routes/EmployeeRoutes.jsx`, `shared/navigation.js`, `modules/dashboard/EmployeeDashboard.jsx`, `shared/components/combobox/EmployeeComboBox.jsx` |
| Frontend tests | `frontEnd/tests/task.workflow.test.jsx` (new), `employee-session.test.jsx`, `browser/session.smoke.cjs`, `browser/run-session-smoke.cjs`, `README.md` |
| Documentation | `docs/architecture/api-contracts.md`, this report |

No model, dependency, lockfile, Quotation or Dashboard backend changes are included. Earlier M0 changes remain in the working tree for review.

## Commands and executed results

From `frontEnd`:

```sh
npm test -- --runInBand --coverage=false
node tests/browser/run-session-smoke.cjs --tasks
node tests/browser/run-session-smoke.cjs
npm run build
```

From `backEnd`:

```sh
node node_modules/jest/bin/jest.js --config tests/jest.config.js --runInBand --coverage=false --cache=false --silent
```

The browser launchers start the real backend through `npm start`, Vite and new disposable MongoDB fixtures, then stop their services. See [test setup](../../frontEnd/tests/README.md) for browser prerequisites. Existing `.env` files and production data are not modified.

| Check | Executed result |
|---|---|
| Real MongoDB Task workflow integration | 58/58 passed: actual HTTP, login JWTs, permissions and repositories; includes concurrent requests and deterministic stale-write rejection |
| Focused Task service/controller regressions | 30/30 passed; includes narrowed permission, conditional-write conflict/retry and trusted actor handling |
| Full backend suite | 290 passed, 1 pre-existing failure: Order PDF mock at `tests/unit/order.service.test.js:100` |
| Rendered frontend tests | 48/48 passed, including 20 new Task cases and all 28 M0 session regressions |
| M1 actual browser workflow | 9/9 passed: Admin UI creates/assigns A; A starts/completes; Admin sees done and reassigns B; A loses list/detail access; B receives the same completed task |
| Existing M0 browser regression | 18/18 scoped checks passed, including Admin Tasks/Quotations/details/Profile and session/logout/navigation |
| Browser error/exposure checks | No JavaScript exceptions, secrets, obsolete Employee APIs or unexpected restricted requests; deliberate post-reassignment detail access returns 404 |
| Changed-file lint / whitespace | Passed for backend, frontend and focused tests; no new warnings |
| Frontend production build | Passed with existing duplicate `cta` key and large-bundle warnings |
| Whole-project frontend lint | 20 existing errors / 3 warnings remain in unrelated files |

Both browser runs separately recorded the known Admin Dashboard metrics 500. They do not claim that metrics work. All four temporary backend/frontend ports were confirmed closed after the launchers finished.

M1 browser results and screenshots are in `/var/folders/kw/ctk1tq0s1ts_wt6c90x064t00000gn/T/worknest-session-smoke-y0bKAN/`; the M0 regression report is in the sibling `worknest-session-smoke-d4jtvM/` directory. Reports omit credentials. Both completed/reassigned Task screenshots were inspected after the run.

## Remaining limits

- Existing Admin Dashboard metrics failure and Order PDF test defect remain outside M1.
- Whole-project lint/build warnings outside the touched Task files are not repaired here.
- Open views update on refetch/focus/refresh, not through real-time notifications. Concurrent conflicts require refresh/retry; failed status requests are not automatically repeated.
- Employee Quotation workflows, Customer Creation and every other excluded feature remain deferred.
