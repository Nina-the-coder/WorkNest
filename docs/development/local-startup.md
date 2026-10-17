# Local startup and Sharp verification

Current startup instructions updated: 2026-10-16 after M2. The Sharp investigation and original test tables below are the **2026-10-15 historical baseline**. Later [session/profile](employee-session.md), [Task](task-workflow.md) and [Quotation](quotation-integration.md) implementation reports supersede resolved findings such as missing logout/profile and legacy Employee requests. The known Admin Dashboard metrics 500 remains separate.

## Current normal development startup

Use npm inside each application directory; the repository root has no package.json and its lockfile is empty. On this reviewed machine, keep the existing ignored environment files. `backEnd/.env` now selects the approved isolated local `worknest-dev` replica set; it also supplies `JWT_SECRET` and optional `PORT` (default 5000). `frontEnd/.env` supplies `VITE_BACKEND_URL` as the backend origin, without an `/api` suffix.

Quotation persistence requires a transaction-capable database. The [D8 verification report](quotation-d8-verification.md#routine-local-startup-shutdown-and-cleanup) records the configured replica set, recovery procedure and verified graceful stop/start. From `backEnd`:

```sh
node scripts/local-mongodb.cjs start
node scripts/local-mongodb.cjs status
npm start
```

Require `writablePrimary: true` and `sessions: true` in status output before starting the application. For backend auto-reload, use `npm run dev` instead of `npm start`; both target `src/server.js`. The server connects to the configured database before listening.

From `frontEnd`, in another terminal:

```sh
npm run dev
```

The database helper has no automatic boot/login registration. Run `start` manually after a machine restart; repeated starts reuse the reviewed healthy process. **No actual operating-system reboot was tested.** After stopping application writers, gracefully stop only the isolated database from `backEnd`:

```sh
node scripts/local-mongodb.cjs stop
```

Data/config/backups remain intact. The helper does not control the original shared MongoDB service, initialize a replica set, restore a backup or modify environment files. Its private `state.json` and `mongod.conf` persist under ignored `.worknest-local/mongodb/` on this machine. A fresh clone therefore needs its own approved development configuration and verified transaction-capable MongoDB setup; this helper is not a fresh-clone bootstrap installer. Do not rerun historical one-time `/private/tmp` verification scripts as routine startup.

For a missing installation, run `npm ci --include=optional` separately in `backEnd` and `frontEnd`. Preserve existing package-lock files and environment configuration; no Sharp upgrade or reinstall was needed on this machine. There is no checked-in `.env.example`.

Environment files and the entire private `.worknest-local/` data/config/backup tree are ignored by Git. At the 2026-10-16 review, the index was empty, no sensitive-named files were tracked, and all private local files were ignored. Keep those artifacts outside review commits; only source, tests and sanitized reports belong there.

## Historical Sharp investigation — 2026-10-15


Sharp is eagerly imported through [app.js](../../backEnd/src/app.js) → [product.routes.js](../../backEnd/src/modules/product/product.routes.js) → [image.middleware.js](../../backEnd/src/middleware/image.middleware.js).

The earlier generic “Could not load the sharp module using the darwin-arm64 runtime” error was reproduced under **Jest 27**, not ordinary Node startup. Jest's resolver could not resolve the exported native subpath `@img/sharp-darwin-arm64/sharp.node`. That export points to the existing `lib/sharp-darwin-arm64.node` file. Native Node resolves it correctly; the existing Jest resolver does not. Sharp catches that resolution error and prints generic installation suggestions, which incorrectly suggested a damaged native installation in the earlier report.

Verified environment:

| Component | Installed / locked value |
|---|---|
| OS / architecture | macOS 27.0.1, darwin arm64 |
| Node / npm | v24.11.1 / 11.6.2 |
| Sharp | 0.34.4 |
| Native package | @img/sharp-darwin-arm64 0.34.4 |
| libvips package | @img/sharp-libvips-darwin-arm64 1.2.3; runtime libvips 8.17.2 |

Both native files match arm64 and Node satisfies Sharp's declared engines. Direct `require('sharp')`, native WebP encoding/decoding and full `require('./src/app')` all worked without an installation change. No active Node/npm/Sharp architecture or optional-dependency override explained a separate failure.

The narrow mapping in [jest.config.js](../../backEnd/tests/jest.config.js) resolves only Sharp's native export subpath to its installed file. It does not mock Sharp, change production module resolution or upgrade Jest. Recheck that physical package layout if Sharp is upgraded later.

An additional real startup defect was reproduced: `npm start` pointed to missing `backEnd/server.js`. [package.json](../../backEnd/package.json) now targets `src/server.js`. No lockfile change is needed for a script correction.

If a different machine actually lacks its platform's optional binaries, restore the existing backend installation with `npm ci --include=optional` from `backEnd`; inspect its real platform/architecture before considering any version change.

## Historical startup and authentication checks — 2026-10-15

Verification used a new disposable local MongoDB database, generated test credentials and environment overrides for both servers. Existing application environment files and database records were not changed. The tested backend was the real `npm start` process, and the frontend was the real Vite dev server. This does not verify connectivity to the database in someone else's existing environment file or prove transaction support.

| Check | Actual result |
|---|---|
| Backend start | Passed; MongoDB connected, server listened and mounted business routes responded |
| Frontend start | Passed; Vite served the React app |
| Admin / Employee login | Both returned 200; both actual browser form logins reached their role dashboard |
| Inactive account login | 401 |
| Existing token after Admin deactivation | 401 on a protected API |
| Unauthenticated ADMIN registration | 401; no account created |
| Unauthenticated protected request | 401 |
| Employee/Customer/Product/Task/Quotation/Order list APIs | 200 using the Admin test account; no password fields or hashes observed |
| Seeded quotation detail API | 200; safe response |
| Full-app identity integration tests | All 43 passed, now importing the actual [Express app](../../backEnd/tests/integration/identity.security.test.js) instead of a router-only harness |

## Historical browser results — 2026-10-15

Headless Brave with an isolated temporary profile was driven through Chrome DevTools Protocol. These were real DOM, navigation and network checks, not frontend source inspection or HTTP-only page requests. The quotation existed in the disposable database before the browser opened its details page.

| Page / action | Rendered | Authentication / API result |
|---|---|---|
| Admin Dashboard | Yes | Login succeeds; metrics request fails with 500, so Dashboard smoke check fails |
| Admin Task Management | Yes | Pass; Task and Employee APIs respond without authentication/API errors |
| Admin Quotation Management | Yes | Pass; quotation list API responds without authentication/API errors |
| Existing quotation details | Yes | Pass; detail and related list requests succeed |
| Admin Profile | Yes | No password/hash in rendered data or stored login user; no profile API is implemented |
| Employee dashboard | Yes | Login succeeds; legacy `/api/employee/*` requests return 404, so dashboard smoke check fails |
| Logout UI | No control exists | Actual UI logout is unavailable; not claimed as passed |
| Simulated session removal | Yes | Removing token/user keys and opening a protected page redirects to `/`; API request without token returns 401 |

No browser JavaScript exceptions were recorded. API failures above still count as failures. Browser response inspection found no password fields; server response checks and the integration suite also excluded bcrypt hashes.

Profile remains incomplete: cached login data omits empId/phone/createdAt, and the page renders missing values/“Invalid Date.” GET `/api/auth/me` returns 404 because that endpoint is not yet implemented. Session-key removal is only a test of the existing guard; it is not a substitute implementation of a logout control or server token revocation. The current login page also logs its token-bearing login response to the browser console; this issue did not change authentication UI.

## Original follow-up findings — 2026-10-15

- Dashboard metrics calls nonexistent `QuotationRepository.countDocuments`, producing 500. See [dashboard.service.js](../../backEnd/src/modules/dashboard/dashboard.service.js).
- Employee dashboard still calls unmounted legacy endpoints. Its integration remains a later milestone.
- Profile completeness and actual logout UI remain follow-up work.
- The full backend suite reports **136 passed, 1 failed** (15 suites passed, 1 failed). The pre-existing [Order PDF test](../../backEnd/tests/unit/order.service.test.js) fails at line 100: `generateOrderPdf.mockResolvedValue is not a function`.
- Frontend production build passed with the existing duplicate `cta` key and large-bundle warnings. Backend startup emits existing deprecated MongoDB connection-option warnings; these do not prevent startup.

These findings were reported, not repaired as part of the original Sharp/startup fix. The later M0/M1/M2 reports linked above record resolved findings and current verification. That original issue's temporary services/disposable database were stopped; normal development now uses the current replica-set procedure at the top of this document.
