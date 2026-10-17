# M2 deployment/runtime compatibility review

Reviewed 2026-10-16. This is a local development compatibility review, not verification of an unprovided production deployment. No commit, merge or M3 work was performed.

## Normal configuration and startup

The current `backEnd/.env` selects the persistent isolated MongoDB 8.2.2 replica set `worknest-dev` on `127.0.0.1:27018`. Read-only `hello` confirmed writable PRIMARY and logical sessions. No inherited MONGO_URI override was present. The running normal backend on port 3000 had established connections to port 27018; the regular frontend on port 5173 uses its existing `VITE_BACKEND_URL` targeting that backend.

A fresh `npm start` from `backEnd` also loaded the unchanged `.env`. Only its HTTP PORT was overridden to an available port to avoid stopping the already running development server. There was no database, JWT-secret or MongoMemoryServer override in this check. Actual Admin/Employee HTTP login/profile and Employee quotation create/edit/submit → Admin approve → Employee read/locked-edit denial/other-owner denial passed on the configured development database.

The existing real frontend/backend then passed all 11 quotation browser checks using generated temporary review accounts and customer/product/task fixtures in that same configured development database. The workflow included Employee draft creation/editing/submission, Admin rejection, Employee correction/reopen/resubmission, Admin approval, Employee refresh/locked edit, Employee B denial and existing Admin creation/editing/Task rendering. Browser exceptions, exposed authentication secrets and obsolete/restricted Employee requests: zero. The already known Admin Dashboard metrics 500 was recorded separately.

Normal startup therefore supports quotation transactions. No shared-service configuration change or runtime dependency upgrade is needed. The missing replica-set startup step in the entrypoint documentation was corrected.

## Original shared service and data

The original loopback MongoDB service remains a writable standalone. Its MongoDB configuration and LaunchAgent are byte-identical to the private pre-D8 backups. All eight original collection counts, document SHA-256 digests and index specifications still match the pre-D8 manifest. No original service restart, configuration edit or original database write was performed.

Normal application review fixtures were created only in the separate configured WorkNest development copy and were removed. After each run, all seven pre-existing non-counter business collection hashes/counts matched the immediately preceding snapshot, including historical quotations/items. Quotation-number counters legitimately advance during real API creation; test numbers are not rewound or reused. Exact fixture/counter results are in the private review evidence.

## Restart and reproducibility

After the first normal application check and fixture cleanup, only the isolated WorkNest database was gracefully stopped and started using `backEnd/scripts/local-mongodb.cjs`. All eight isolated collection counts, hashes and indexes, including the then-current counter, matched before/after. The same configured connection returned to writable PRIMARY with sessions; the backend environment file bytes were unchanged. The original shared service and its manifests remained unchanged.

This exercised persistent config/data and process recovery, **not an actual machine reboot**. On the same machine, the documented post-boot procedure from `backEnd` is:

```sh
node scripts/local-mongodb.cjs start
node scripts/local-mongodb.cjs status
npm start
```

Require `writablePrimary: true` and `sessions: true`, then run `npm run dev` from `frontEnd`. The helper has no automatic boot/login registration. Private config/state/data persist across normal reboots. The [D8 recovery instructions](quotation-d8-verification.md#same-machine-reboot-and-stale-pid-metadata) cover safe stale-PID review; never kill an unrelated process or remove database lock/data files to bypass a refusal.

A fresh clone needs its own environment configuration and verified transaction-capable MongoDB provisioning. This lifecycle helper intentionally manages already reviewed private metadata; it is not a portable fresh-clone installer. Another deployment must provide a supported replica set/mongos topology and verify its own D8 gate. Pointing MONGO_URI at the original standalone is not a compatible fallback.

After the isolated restart, a second fresh `npm start` check and all 11 regular frontend/backend quotation browser checks passed. The existing application connection recovered successfully. Both runs cleaned up their fixtures and preserved pre-existing business collection hashes. Together they consumed six test quotation numbers; the counter was deliberately not rewound. No historical quotation was modified. Normal configured-environment browser total: **22/22 passed** across the pre/post-restart runs.

## Persistence and historical pricing review

Header/item creation and replacement pass the same session to every persistence operation. Reads and authorization/status checks occur inside the transaction; mutations condition on current scope, owner, status and updatedAt. Competing updates reload and revalidate after transaction retries. Populated references are read serially within the session. Session cleanup occurs on success/failure, without a nontransactional fallback. Real HTTP tests verify failure after an actual first item write leaves neither partial header/items nor altered old items/timestamps; review/action races and ownership reassignment are also covered.

Counter allocation is intentionally outside the transaction, so failed/retried/test creation can leave quotation-number gaps. It does not leave partial quotations or reuse numbers.

The review found and corrected one narrow historical-pricing comparison edge: under a positive percentage discount, omitting/changing the inactive amount input must not make an otherwise unchanged legacy line reprice. Backend comparison and shared form preview now ignore that inactive comparison while still validating any supplied raw amount. Zero-percent amount discounts and deliberately changed quantity/price/rate/percentage retain their existing behavior. A real HTTP regression covers legacy rounding, removed-product snapshots, omitted/irrelevant amounts, invalid amount rejection without writes and deliberate repricing; frontend regressions mirror the rule. This correction did not rewrite stored business data.

A raw, read-only configured-database scan covered **12 legacy quotations / 15 items**, including one archived quotation. All stored line components and headers reconciled with the approved pricing checks; **zero quotations require pricing review**. The scan never invoked a mutation/save/submit service. Its private mode-0600 report contains business quotation IDs/status/reasons, without customer PII or credentials, at `.worknest-local/reviews/quotation-pricing-review-20261016.json`. No historical financial data was changed.

## Git and final checks

- Staged index: empty. No files were staged, unstaged, committed or merged during review.
- No tracked sensitive-named environment/backup/private data files were found.
- `backEnd/.env`, `frontEnd/.env`, private database configuration/state/data, backups and runtime browser reports are ignored. Secret-pattern matches were confined to ignored local environment/backup copies; no secret values were printed.
- Code/tests changed by this review: backend quotation service and its HTTP integration regression; frontend quotation utility and pricing regression. Documentation changed: root README, current local startup, D8 verification and this report.
- Focused backend verification: **122 passed** across five suites — 69 real HTTP/replica-set workflow, 27 pricing and 26 service/controller/router checks.
- Full frontend verification: **113 passed**, five suites.
- Changed backend/frontend lint, syntax and final whitespace checks passed. Frontend production build passed to `/private/tmp/worknest-m2-runtime-review-build` with existing duplicate-button-key and large-chunk warnings.
- Earlier full-backend checkpoint remains 385 passed / one pre-existing Order PDF mock failure; the additional targeted pricing fix/regression above passed. No unrelated Order/Dashboard/lint repair was attempted.

Sanitized normal-startup and browser evidence is retained privately under `.worknest-local/reviews/M2-RUNTIME-20261016-*/`; isolated restart evidence is `.worknest-local/mongodb/runtime-restart-result.json`. Test credentials and browser profiles remain outside Git in ignored private directories. See [current startup](local-startup.md), [D8 evidence/recovery](quotation-d8-verification.md) and [M2 implementation inventory](quotation-integration.md).
