# WorkNest identity, permissions and ownership

Audit baseline: 2026-10-11. Decisions updated: 2026-10-15. **Implemented** describes runtime code; **Approved direction** records the user's decisions; **Proposed detail** requires approval at this checkpoint. Approval of direction does not authorize runtime work before this checkpoint is approved. See [architecture and stages](application-architecture.md), [API contracts](api-contracts.md), and [workflows](workflow-contracts.md).

## 1. Identity and authentication contract

### Implemented

- One [User model](../../backEnd/src/models/user.model.js) represents admins and employees. Persisted roles are lower-case `admin` and `employee`; ADMIN/EMPLOYEE are display labels. No separate Employee model exists.
- `User._id` is the security identity. Optional `empId` (`EMP…`) is a human identifier, not a second login identity. Task assignee/assigner, quotation employee/creator/approver, Customer.addedBy and Order.addedBy reference User ObjectIds.
- [Login](../../backEnd/src/modules/auth/auth.service.js) checks email/password and issues a one-day JWT `{id, role}`. Response user includes `_id,name,email,role,permissions`, but not empId/phone/status/createdAt. No current-user/profile, refresh or logout API exists.
- [verifyToken](../../backEnd/src/middleware/auth.middleware.js) reloads the user using JWT `id`, then derives permissions from the persisted role. A token's role and a body-supplied employee ID are not proof of access. The middleware currently does not reject inactive or soft-deleted users; login also lacks those checks.
- Frontend login persists `token` and `user` in localStorage. There is no session context/hydration. Permission helpers safely parse user JSON, but ProtectedRoute and several pages do not. Permissions in the browser can be stale after role changes; backend permissions are resolved on every request.
- Registration is Admin-only. Its validator accepts `admin`/`user`, conflicting with User's `admin`/`employee` enum. The auth service hashes the password before the User pre-save hook hashes it again. Employee creation follows a different, single model-hook hashing path; preserve that working path when correcting registration.

### Proposed corrections and additive session contract

1. Keep existing JWT/Bearer authentication. Require the persisted user to exist, be nondeleted and active at login and on every authenticated request. Invalid/expired/unusable sessions return 401; do not rely on frontend checks.
2. Add **proposed** `GET /api/auth/me`, authenticated without Employee-directory permission. Return `{user:{_id,name,email,role,permissions,empId,phone,status,createdAt}}` with absent optional fields handled safely. Select safe fields explicitly; never serialize passwords. Use the same projection for additive login fields if needed.
3. Initialize one small shared frontend session state from existing storage, verify it through `/me`, then render guards/navigation. Handle malformed JSON and temporary network errors separately from a confirmed 401. Revalidate on reload/focus as appropriate; role changes can refresh permissions without a second auth system.
4. A 401 clears only WorkNest `token`/`user` keys and sends the user to the actual `/` login route. A 403 retains the session and shows denied access or an inline action error. Denied-page dashboard navigation depends on the initialized role. Logout, if exposed, clears local session state; no server revocation/refresh infrastructure is proposed.
5. Read-self Profile through `/me` is approved under D4; do not grant `EMPLOYEE_READ` to expose an employee's own profile. Self-update is deferred and outside this scope.

## 2. Permission architecture

Sources: [constants](../../backEnd/src/utils/permissions.js), [role map](../../backEnd/src/utils/rolePermissions.js), [permission middleware](../../backEnd/src/middleware/permission.middleware.js), [frontend helpers](../../frontEnd/src/utils/permissions.js), [ProtectedRoute](../../frontEnd/src/shared/components/ProtectedRoute.jsx).

Admin has every defined permission; a duplicated QUOTATION_SUBMIT entry is harmless. Employee currently has CUSTOMER_READ, PRODUCT_READ, TASK_READ, ORDER_READ, QUOTATION_READ/CREATE/UPDATE/SUBMIT and DASHBOARD_READ. Employee has no TASK_UPDATE, directory, approval, rejection or archive permission.

Backend `requirePermission(...permissions)` accepts **any** listed permission. Frontend ProtectedRoute's `requiredPermissions` requires **all**. Existing routes usually request one permission; new checks must state their semantics explicitly, not assume these helpers agree for arrays.

Proposed enforcement chain:

```text
authenticated active User
  → existing operation permission
  → centralized resource visibility/ownership policy
  → service field and workflow validation
  → scoped repository read/write
```

Keep role-to-permission assignment centralized. Put broad-management versus assigned-record scope in a small reusable policy helper where useful; pass the authenticated actor to services. Replace scattered role comparisons in touched paths with that policy, rather than implementing a database permission engine. Frontend uses server-issued permissions plus resource/status data to display actions. Backend performs every check independently.

This supports future role evolution without scattering role names, but a new role would still require a reviewed User enum, role map, resource policy and route/layout configuration. No new role is part of this plan.

## 3. Application-wide operation matrix

`A/E` means current Admin/Employee availability at mounted APIs. `Absent` means no endpoint, even if a permission constant exists. The last column describes target behavior; the decision register distinguishes approved direction from proposed details. Backend route permission names abbreviate resource prefixes (`READ` under Customers means CUSTOMER_READ).

| Module / operation | Current A / E | Current resource/state rule | Enforcement now | Proposed correction / frontend actions |
|---|---|---|---|---|
| Employees: read/list/detail | Yes / No | All nondeleted Users, including admins/inactive; detail by empId | EMPLOYEE_READ route; employee repository | Admin directory only; safe fields; assignment selectors limit to valid active employees without changing directory management scope |
| Employees: create | Yes / No | Creates/restores User; caller may select either existing role | EMPLOYEE_CREATE; employee service + User schema | Admin create; safe response, validation; no employee action |
| Employees: update | Yes / No | Nondeleted empId; role/status/password allowed | EMPLOYEE_UPDATE; employee service | Admin edit; safe validation and role-change session behavior |
| Employees: archive | Yes / No | Soft delete | EMPLOYEE_ARCHIVE; employee service | Admin archive; archived user loses session access |
| Employees: read self | Absent / Absent | LocalStorage profile only | No self API | Both roles via proposed `/auth/me`; no directory permission |
| Customers: read | Yes / Yes | All nondeleted customers, regardless addedBy | CUSTOMER_READ; customer repository | Retain shared reads for current scope; employee reads are not a permanent read-only customer policy; standalone catalog page remains optional |
| Customers: create | Absent / Absent | CUSTOMER_CREATE exists only for Admin; UI POST has no mounted route | No active handler | D2 approves eventual Employee creation as a core acquisition capability; implement through separate CC-1 issue, not this integration/security stage |
| Customers: update | Yes / No | Any nondeleted customer by business code; no status restriction | CUSTOMER_UPDATE; customer service | Admin edit; employee read-only |
| Customers: archive | Yes / No | Any nondeleted customer; soft delete | CUSTOMER_ARCHIVE; customer service | Admin archive; employee action hidden |
| Products: read | Yes / Yes | Entire catalog | PRODUCT_READ; product repository | Shared read-only employee catalog/quotation selector |
| Products: create | Yes / No | Multipart; model-required fields, no nonnegative price rule | PRODUCT_CREATE; upload middleware + product service/model | Admin create; employee action hidden; validation correction if included |
| Products: update | Yes / No | Any product by business code | PRODUCT_UPDATE; product service | Admin edit; historical quotations must use their own snapshots |
| Products: archive | Yes / No | Actually hard delete, despite ARCHIVE name | PRODUCT_ARCHIVE; product repository | Preserve behavior pending separate decision; employee action hidden; quotation edits must tolerate removed historical references |
| Tasks: read list | Yes / Yes | All nondeleted tasks; no assignee filter | TASK_READ; task repository | Admin all; employee only assignedTo = authenticated User._id |
| Tasks: read detail | Absent / Absent | getTaskById service exists without route | No mounted GET detail | Proposed shared detail route with same assignment policy as list |
| Tasks: create | Yes / No | Client supplies assignedBy; references not checked for active user | TASK_CREATE; task service/model | Admin create; derive assignedBy from actor and validate assignee |
| Tasks: assign/reassign | Yes / No | Part of create/update, not a separate permission; any enum status retained | TASK_CREATE or TASK_UPDATE | Admin-only assignment; preserve status on reassignment (D1); no employee selector |
| Tasks: update | Yes / No | Admin can change allowed fields; any enum-to-enum status change | TASK_UPDATE; task service/model | D1 approved: Admin full editor; employee forward status-only updates on assigned tasks; grant TASK_UPDATE only with field/assignment/state enforcement |
| Tasks: delete | Yes / No | Soft delete; lookup also finds already deleted records | TASK_DELETE; task service | Admin delete/archive presentation; employee legacy Delete removed |
| Quotations: read list/detail | Yes / Yes | Admin all; employee quotation.employeeId = actor; nondeleted | QUOTATION_READ; controller + repository | Retain own-quotation views and same detail protection |
| Quotations: create | Yes / Yes | DRAFT; employeeId forced to actor except Admin assignment; active customer/products checked | QUOTATION_CREATE; controller/service/validator | Both create; Admin assignment selector only; validate selected user |
| Quotations: edit | Yes / Yes | DRAFT or REJECTED; ownership checked before update, but employeeId can then be changed | QUOTATION_UPDATE; controller/service | Both authorized editable records; prohibit employee reassignment and validate changed references; locked-state page is read-only |
| Quotations: submit | Yes / Yes | DRAFT only; at least one stored item | QUOTATION_SUBMIT; controller/service | Both authorized drafts; validate complete stored quotation before submission; pending state |
| Quotations: approve | Yes / No | SUBMITTED only | QUOTATION_APPROVE; controller/service | Admin review actions only; employee sees decision |
| Quotations: reject | Yes / No | SUBMITTED only; nonblank reason | QUOTATION_REJECT; controller/service | Admin Reject with reason; employee sees reason/actor/date |
| Quotations: reopen | Yes / Yes | Owner/Admin; REJECTED → DRAFT; clears rejection fields | QUOTATION_UPDATE; controller/service | Approved state path retained; proposed D6 detail preserves latest rejection fields and labels them historically outside REJECTED |
| Quotations: archive | Yes / No | Soft delete; backend currently permits every status | QUOTATION_ARCHIVE; controller/service | Preserve existing Admin API behavior and UI availability; DRAFT-only backend restriction is not approved; no employee archive |
| Quotations: convert | Absent / Absent | Enum transition and Order link exist; no mounted operation | No active conversion handler | Future separately approved Order integration; no working Convert action claimed |
| Orders: read/list/export | Yes / Yes | All nondeleted lists; exports do not even filter deleted or ownership | ORDER_READ; order service/repository | D3 approved: withhold Employee backend access to every list/export path until ownership is implemented; preserve Admin access |
| Orders: create | Absent / Absent | ORDER_CREATE assigned to Admin; no POST mounted | No active create handler | Separate Order integration; employee legacy POST removed from mounted views |
| Orders: update | Yes / No | PUT only changes status | ORDER_UPDATE; order service | Preserve Admin status UI; no employee edit |
| Orders: change status | Yes / No | Any string; no state machine | ORDER_UPDATE; order service/model | Existing Admin behavior recorded; do not invent Order lifecycle in this integration |
| Orders: archive | Yes / No | Soft delete | ORDER_ARCHIVE; order service | Admin archive; employee action hidden |
| Dashboard: Admin metrics | Yes / Yes | Same global metrics for either role; handler has broken repository call | DASHBOARD_READ; dashboard service | D5 approved: management metrics only for Admin; deny Employee global access before scoped implementation is available |
| Dashboard: Employee metrics | Absent / Absent | No scoped metrics implementation | No resource-aware service rule | D5 approved: assigned-task / owned-quotation summaries only, same backend; no company Product/Order statistics |
| Profile: read self | No API / No API | Admin frontend displays cached login user; Employee route absent | LocalStorage only | Both roles via `/me` and shared Profile component |
| Profile: update self | Absent / Absent | No self-write contract | No handler/permission | Defer (D4); no client-controlled role/status/permissions/empId changes |

All implemented business routes require authentication; `/auth/login` is public and `/auth/register` uses an Admin role guard instead of operation permission. Unmounted role-specific legacy endpoints are not available operations.

## 4. Entity ownership and safe visibility

| Entity | Association implemented | Current visibility | Proposed authoritative rule |
|---|---|---|---|
| User/Employee | `_id` identity; empId display; optional createdBy/updatedBy audit | Admin directory; self only cached in frontend | Safe self projection; directory remains Admin-only |
| Task | assignedTo = receiver; assignedBy = assigning actor; no dedicated immutable createdBy field | All active tasks for either role | Employee reads/updates only current assignedTo; derive assignedBy at creation. Reassignment changes who can read immediately; no new activity-history model |
| Quotation | employeeId = owner/assigned employee; createdBy = actual creator; customerId; item links | Admin all; employee by employeeId | Keep creator and owner distinct; employee cannot alter owner; Admin assignment validated. Rules apply to list/detail/edit/actions and atomic writes |
| Customer | addedBy = creator association; no assignment field | Shared nondeleted catalog | Keep shared reads; future Employee creation under CC-1 derives addedBy from actor. Creating a customer does not itself decide exclusive ownership or wider edit/archive rights |
| Product | No user/company ownership | Shared catalog | Read shared; Admin mutations; quotation product snapshots survive changes/deletion |
| Order | addedBy = actor, quotationId link; customer/product/total snapshots | Unscoped; legacy population mismatch | D3: Employee access deferred and denied at backend; future ownership remains unresolved, not implicitly approved as addedBy or quotation owner |
| Dashboard | Derived records, no ownership field | Global | D5: Employee assignedTo/employeeId scope on nondeleted Tasks/Quotations; Admin metrics retain their current response contract |

List filtering must happen in the repository query before pagination/counts. Detail/mutation lookup must enforce the same policy and `deleted:false`; changing a URL ID cannot widen visibility. Use 403 for forbidden operations, or a consistent 404 for out-of-scope record lookup if approved; never return a record first and rely on client filtering. Keep permission denial 403.

Mongoose refs do not enforce foreign-key existence. Validate new customer/product/assignee references in services. Existing quotation item snapshots are commercial data, not a reason to reread live product prices on display.

Safe User population is a P0 correction: Task assignedTo/assignedBy, Customer.addedBy and detailed Order.addedBy currently populate User without a field selection; User.password has no default exclusion. Employee POST also serializes the created User directly. Select only necessary fields such as `_id,name,empId,email`; retain password access only for password verification. Test serialized responses, not only middleware permission results.

Security implementation comes before Employee feature activation: remove password hashes from all touched direct/populated responses; reject inactive/deleted login and existing-token use; scope Employee Task reads; deny Employee Order list/PDF/CSV and global metrics; prevent Employee quotation owner changes. Remove Employee ORDER_READ from the existing central map so stale browser permissions cannot preserve backend access. Keep DASHBOARD_READ for the future scoped dashboard, but deny the Employee global-metrics path until that scoped response exists. Do not grant TASK_UPDATE before its assignment/field/state restrictions ship. These access restrictions are intentional security corrections; Admin operation permissions and success envelopes remain compatible.

No tenant boundary exists in current models. Do not introduce one implicitly or treat companyType as company identity. If an external deployment has tenant rules absent from this repository, that is an additional requirement needing evidence and a separate decision.

## 5. UI responsibilities

- Navigation: show only registered routes allowed by current permissions; choose role-correct URLs. Profile requires authentication, not DASHBOARD_READ.
- Task Employee view: assigned records, read-only details, approved status controls; no create, assign, full edit or delete. Admin retains management actions.
- Quotation view: Create with CREATE; Edit with UPDATE plus ownership and DRAFT/REJECTED; Submit with SUBMIT plus DRAFT; Admin Approve/Reject only with their distinct permission plus SUBMITTED. Backend still checks every operation.
- Every mutation disables its button while pending and reports success/failure from the server. Locked records, empty lists, failed fetches and missing/forbidden details are distinct states.
- Changes to browser storage or hidden buttons never grant API permission. Frontend never sends actor/ownership values as proof of identity.

## 6. Approval decisions

The user approved the overall direction and clarified D1–D8 on 2026-10-15. None of these target changes is implemented by this documentation update. Implementation starts only after approval of this revised checkpoint.

| ID | Approved direction | Detail / boundary at this checkpoint |
|---|---|---|
| D1 | Employee status-only updates on assigned tasks; forward transitions; Admin-controlled reassignment/reopening | `pending → in-progress → done`; no Employee backward/reopen or direct pending→done; same-status retry no-op. Admin retains existing enum transitions; reassignment preserves status. Existing TASK_UPDATE ships together with actor/assignment/field/state guards |
| D2 | Employees must eventually create customers; Customer Creation is separately scoped; Product management remains Admin-only | CC-1 is required business work, not a permanent prohibition. Current reads/quotation selection remain shared; no CUSTOMER_CREATE grant or new Customer endpoint in security/Task/Quotation stages. Product reads remain available; no Employee create/update/archive |
| D3 | Defer Employee Orders and restrict unsafe backend access | Deny Employee list and both exports through the existing permission architecture. Preserve Admin access; future owner definition and re-enabling access require a separate reviewed implementation |
| D4 | Read-self Profile only | Proposed `/auth/me` serves both roles; no directory grant or self-write endpoint |
| D5 | Employee dashboard based on assigned Tasks and owned Quotations | Deny global metrics immediately in the security stage; proposed scoped response uses existing shared metrics URL and `{pendingTasks,quotationsGiven}` only. Admin's existing four-field response stays compatible; no placeholder zeros for unsupported company statistics |
| D6 | Preserve current quotation status/revision workflow; explain clearing consequences and propose minimum retention | **Proposed detail:** retain existing rejectionReason/rejectedBy/rejectedAt through reopen/resubmit/approval; replace only on a new rejection and label “Most recent rejection” outside REJECTED. This retains one event, not full history. No new fields/history infrastructure. No approved change to Admin archive eligibility; conversion stays separate |
| D7 | One backend-authoritative pricing/rounding contract; clarify GST and draft completeness | **Proposed detail:** new-item omitted GST uses existing compatibility default 18, explicit 0 stays 0, null/blank/boolean invalid; existing unchanged lines retain their stored rate. Exact/scaled half-up component arithmetic and summed line totals. Keep commercially complete drafts for v1; incomplete/customerless/partial-item drafts deferred. API validity remains optional; current Admin form's stricter requirement is preserved. See exact rules in workflow contract |
| D8 | Verify MongoDB transaction support before quotation persistence changes | **Current verification result:** deployment capability unverified; repository has no topology assurance or transaction test. Require topology/capability evidence and disposable rollback tests before changing header/item persistence. Replica set or supported sharded topology required; standalone needs an approved alternative. No silent fallback or historical recalculation |

D6 retention and D7 default/precision/draft details are proposals for this checkpoint, not claims of prior approval or working behavior. D8 is a persistence prerequisite; it does not block separate security corrections using scoped queries or single-document ownership/state guards.

### Separately scoped issue CC-1 — Customer Creation

Employee customer acquisition is part of WorkNest's intended core workflow. A later small implementation must mount the missing shared POST `/api/customers` for permitted Admin/Employee creation, use the existing Customer model/service/API components and CUSTOMER_CREATE permission, derive addedBy from the authenticated actor, validate fields/duplicates, return a safe customer response, and make the newly created customer selectable in a quotation. Existing shared read/update/archive contracts remain compatible; Employee create does not grant edit/archive of all customers. Creation deduplication, duplicate-email rules and visibility implications need a concrete issue plan before implementation. Do not reactivate the legacy handler or build a second Customer module. CC-1 is documented here, not filed or implemented in an external tracker.

## Implemented M3 / CC-1 delta — 2026-10-16

The previously deferred Employee Customer Creation capability is now enabled: the existing central map grants Employee **CUSTOMER_CREATE**, alongside CUSTOMER_READ. Shared POST `/api/customers` records `addedBy` from the authenticated User, never from a supplied employee/creator identity. Shared Customer list/details remain visible across creators for nondeleted records; creation does not grant exclusive ownership or later update/archive rights. No company boundary is invented in models without a company identity.

Customer update/archive and Product create/update/delete remain Admin-only. Employee Customer and Product routes/navigation use the existing session, guards and permissions. Product Catalog is the shared Product page without administrative controls. Existing Product hard deletion and quotation snapshots remain; no new Product status or tax field is introduced. [M3 report](../development/customer-product-integration.md) and [API delta](api-contracts.md#implemented-m3-customerproduct-delta--2026-10-16) provide the concrete contracts and verification.
## Implemented M4 permission delta — 2026-10-17

The approved quotation-to-order and fulfillment implementation reuses the central Admin ORDER_CREATE/READ/UPDATE/ARCHIVE permissions. POST quotation conversion requires ORDER_CREATE and a service-level Admin check; Order reads/details/PDF/CSV require ORDER_READ, fulfillment requires ORDER_UPDATE, soft archive requires ORDER_ARCHIVE. No new role, broad Employee grant or second authorization system was introduced.

**D3 remains in effect:** Employee has no Order access or conversion action. Employees can still read their own converted quotation under the existing quotation ownership policy; this does not grant access to its Order. State, identity, duplicate-link, snapshot and conditional-write checks are enforced by the shared backend, independently of displayed controls. [M4 evidence](../development/order-integration.md) and [API delta](api-contracts.md#implemented-m4-order-delta--2026-10-17) document the implemented behavior.
