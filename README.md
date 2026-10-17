# WorkNest

Monolithic repository for the WorkNest application (backend + frontend).

Quick overview:

- `backEnd/` — Express + MongoDB API server
- `frontEnd/` — Vite + React UI

Architecture and integration contracts (audit dated 2026-10-11):

- [Application architecture and staged implementation plan](docs/architecture/application-architecture.md)
- [Identity, permissions, ownership and approval decisions](docs/architecture/roles-permissions.md)
- [Mounted API contracts and outdated integrations](docs/architecture/api-contracts.md)
- [Admin/Employee workflows and verification plan](docs/architecture/workflow-contracts.md)

These documents retain the original audit baseline and approved decisions. M0–M4 are implemented; their verification reports record the resulting behavior and remaining limits. Start with the current local procedure below, then see [M4 Order conversion and fulfillment](docs/development/order-integration.md), [M3 Customer/Product integration](docs/development/customer-product-integration.md), [M2 integration](docs/development/quotation-integration.md) and the [verified D8 replica-set setup](docs/development/quotation-d8-verification.md).

Quick start on this reviewed development machine:

1. Backend
   - cd `backEnd`
   - retain the existing ignored `.env`; its development `MONGO_URI` selects the verified `worknest-dev` replica set, with `JWT_SECRET` and optional `PORT`
   - `node scripts/local-mongodb.cjs start`
   - `node scripts/local-mongodb.cjs status` — require a writable primary with sessions
   - `npm start` (or `npm run dev` for auto-reload)
2. Frontend, in another terminal
   - cd `frontEnd`
   - retain `.env` with `VITE_BACKEND_URL` pointing to the backend origin
   - `npm run dev`

Run the database helper manually after a machine restart; it has no automatic boot/login registration. A graceful database stop/start was verified, not an actual operating-system reboot. Stop application writers before `node scripts/local-mongodb.cjs stop` from `backEnd`; data and backups are preserved.

For missing dependencies, run `npm ci --include=optional` inside each application directory. A fresh clone also needs development configuration and a transaction-capable MongoDB setup verified through D8: the helper manages this machine's existing ignored metadata and does not bootstrap a new database. There is no checked-in `.env.example`.

See the [final M2 runtime compatibility review](docs/development/m2-runtime-compatibility.md) for normal configured-database/browser, restart, legacy pricing and Git safety evidence.

M4 uses that same verified replica set for atomic approved-quotation conversion. The [M4 report](docs/development/order-integration.md) records the approved fulfillment policy, partial unique index preserving legacy Orders, final tests and deployment checks. Employee Order access remains deferred.

See [current local startup and historical Sharp verification](docs/development/local-startup.md) for details. Environment files and the private `.worknest-local/` database/config/backup tree are ignored; keep them out of review commits. The staged index was empty during the 2026-10-16 sensitive-file review.

# WorkNest

Employee Task, Quotation &amp; Order Management System
