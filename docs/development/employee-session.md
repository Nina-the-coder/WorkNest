# Employee session, navigation and profile

M0 / Issue 3 retains existing Admin and Employee route families, the shared Axios client and the JWT/permission architecture. The [API contract delta](../architecture/api-contracts.md#implemented-delta--m0--issue-3) describes the implemented behavior.

## Local verification

Follow [local startup](local-startup.md) using a disposable development database. Do not use production records for verification. Both applications' existing npm dependencies must be installed; there are no new packages or lockfile changes.

Frontend tests reuse the repository's installed backend Jest/Babel/jsdom and render the actual React session provider, guards, login, navigation and profile. Only authentication transport is mocked at the network boundary; backend integration tests verify the real endpoint, JWT checks and database behavior.

From `frontEnd`:

```sh
npm test -- --runInBand --coverage=false
npm run build
```

From `backEnd`:

```sh
node node_modules/jest/bin/jest.js --config tests/jest.config.js --runInBand --coverage=false tests/integration/identity.security.test.js tests/integration/authorization.security.test.js tests/integration/profile.security.test.js
```

The real-MongoDB suites create isolated MongoMemoryServer databases and local HTTP listeners; they do not load the application's database URI. A sandboxed runner may need permission to bind localhost and start MongoDB. Whole-project frontend lint has existing unrelated failures; lint the changed sources separately without fixing unrelated modules.

For a repeatable browser run from `frontEnd`:

```sh
node tests/browser/run-session-smoke.cjs
```

This starts the actual backend and Vite against new disposable records, runs an isolated headless Chromium browser, and stops its services afterward. See [frontend test instructions](../../frontEnd/tests/README.md) for browser prerequisites, private fixture settings and output paths.

## Executed results — 2026-10-15

| Check | Result |
|---|---|
| Rendered frontend regressions | 28/28 passed; actual React provider/guards/login/navigation/profile with mocked authentication transport |
| New self-profile HTTP/MongoDB regressions | 17/17 passed; actual app, JWT middleware, User model and disposable MongoDB |
| Full backend suite | 221 passed, 1 failed; existing Order PDF mock failure at `tests/unit/order.service.test.js:100` |
| Repeatable browser smoke | 18/18 scoped checks passed; actual Brave/CDP, backend and Vite with disposable MongoDB; known Admin metrics failures recorded separately |
| Admin browser regression | Tasks, Quotation list, existing quotation details, Profile, login/logout passed. Dashboard renders but metrics still fail with the known 500 |
| Employee browser regression | Landing, all three visible menu destinations/active states, self-profile, reload, denied Admin navigation, logout/login again and invalid-token redirect passed |
| Browser exposure/request checks | No JavaScript exceptions, sensitive-data findings or obsolete Employee/global-metrics requests; deliberate forbidden Order probe returned 403 without clearing the session |
| Changed-file frontend/backend lint and whitespace | Passed |
| Whole-project frontend lint | Existing unrelated 26 errors / 4 warnings remain; no unrelated cleanup |
| Frontend production build | Passed with existing duplicate `cta` key and large-bundle warnings |

Both the original disposable startup helper and repeatable browser launcher's services were stopped. Existing environment files and production databases were not modified. Browser screenshots were also inspected: Profile shows real identity/phone/identifier/account dates/status and no invalid placeholders. These checks do not certify deferred Employee Task/Quotation business workflows or the broken Admin metrics endpoint.

## Issue 3 file inventory

| Area | Files changed or added |
|---|---|
| Backend self-profile | `backEnd/src/modules/auth/auth.routes.js`, `auth.controller.js`, `auth.service.js`, `auth.repository.js` |
| Backend tests | `backEnd/tests/integration/profile.security.test.js` |
| Session | `frontEnd/src/main.jsx`, `api/axios.js`, `modules/auth/AuthContext.jsx`, `auth.context.js`, `useAuth.js`, `auth.session.js`, `auth.util.js`, `SessionFeedback.jsx`, `services/auth.api.js`, `pages/Login.jsx` |
| Routing/navigation | `frontEnd/src/routes/AdminRoutes.jsx`, `EmployeeRoutes.jsx`, `layouts/EmployeeLayout.jsx`, `shared/navigation.js`, `shared/components/Sidebar.jsx`, `Header.jsx`, `ProtectedRoute.jsx`, `pages/Unauthorized.jsx`, `NotFound.jsx` |
| Landing/profile | `frontEnd/src/modules/dashboard/EmployeeDashboard.jsx`, `modules/profile/Profile.jsx` |
| Frontend tests | `frontEnd/package.json`, `tests/jest.config.cjs`, `setup.cjs`, `staticMock.cjs`, `employee-session.test.jsx`, `browser/session.smoke.cjs`, `browser/run-session-smoke.cjs`, `README.md` |
| Contracts/verification | `docs/architecture/api-contracts.md`, this guide |

## Scope and remaining limits

- Employee navigation exposes Dashboard, My Quotations and My Profile. Task, Customer and Product sections await separately scoped integration; no fake business pages or Employee Orders are enabled.
- Existing quotation create/edit/detail deep links remain. Their business actions and known Employee directory-fetch issue are deferred; Issue 3 does not claim those workflows are complete.
- Self Profile is read-only. User has no designation or joining-date field; no new schema or misleading joining date is introduced.
- Logout removes client credentials/state only. There is no server logout/revocation endpoint; a copied JWT remains valid until expiration unless the account is disabled/deleted. No token is logged by the login page.
- The existing Admin Dashboard metrics 500 (`QuotationRepository.countDocuments`) and Order PDF unit-test mock failure remain outside scope.
