# WorkNest API contracts

Audit baseline: 2026-10-11. Decisions updated: 2026-10-15. This inventory covers business routes mounted by [app.js](../../backEnd/src/app.js). **Current** in the original inventory describes the audit baseline, not a claim that every defect remains present. **Approved direction** and **proposed detail** describe targets; implemented deltas are recorded separately below. Source remains authoritative. See [permissions/ownership](roles-permissions.md) and [workflow rules](workflow-contracts.md).

### Implemented delta — M0 / Issue 2

The original inventory below is the audit baseline. Issue 2 implements these authorization corrections without changing existing success envelopes:

- Task lists are scoped in MongoDB to `assignedTo = authenticated User._id` for Employees; Admin keeps all nondeleted tasks. New GET `/api/tasks/:taskId` uses the human task code and returns `{task}`; missing, deleted and out-of-scope records all return 404. Task creation derives assignedBy from the actor. Employee writes remain 403 until the M1 status integration.
- Quotation services require the authenticated actor and scope header lookups/list counts by employeeId. Missing/deleted/out-of-scope quotations now uniformly return 404, replacing the earlier cross-owner 403. An Employee's attempt to transfer their own quotation returns 403 before writes. The same owner ID remains acceptable in an existing edit payload; createdBy/status remain protected by existing input allowlists and updatedBy comes from the actor.
- Newly selected customer/owner references must exist and be nondeleted/active. Unchanged historical references remain usable in eligible edits, including when their associated record was subsequently deactivated or archived. Existing historical display, Admin self-assignment, quotation states and archive eligibility are preserved.
- Employee ORDER_READ is removed from the central map, denying list and both export routes with 403 even with older tokens. Other Order mutations remain permission-protected. The current company-wide dashboard endpoint additionally requires Admin role; Employee DASHBOARD_READ remains reserved for a later scoped dashboard.
- Customer reads remain shared and exclude soft-deleted customers. Product reads remain shared; Product and existing Customer mutations stay Admin-only. No Customer POST/CC-1 implementation, Employee UI, pricing, rejection-retention or quotation transaction changes are included.

Unauthorized/invalid authentication remains 401; operation denial is 403; resource scoping uses 404 to avoid revealing another Employee's record. Pre-existing quotation multi-document/concurrency limitations still require the separate D8 persistence work; scoped lookups do not establish transaction safety.

### Implemented delta — M0 / Issue 3

- GET `/api/auth/me` now returns `{user:{_id,name,email,role,permissions,empId?,phone?,status,createdAt}}` through the existing JWT middleware. The session User ID determines identity; query/body IDs are ignored. The repository selects only these fields, rechecks active/nondeleted status, and the service constructs the safe response. Login's existing response stays compatible. No self-edit, refresh-token or logout/revocation API is added.
- One frontend AuthProvider verifies the stored token through `/me` before protected pages render. Cached user data cannot authorize a route. Temporary verification failures display retry/login controls without treating a network failure as expired credentials. Current server identity/permissions replace the cached user; focus and cross-tab credential changes revalidate the session.
- Existing role route families and quotation deep links remain. Leaf permissions are checked; `/employee/profile` is added, and `/admin` / `/employee` redirect to their existing dashboards. Missing role-family pages show an unavailable state. Access Denied returns to the current role's dashboard.
- Sidebar destinations derive from verified role/permissions and update reactively. Employee navigation currently contains Dashboard, My Quotations and My Profile. Task/catalog entries await their integration stages; Orders remain unavailable. The landing page mounts no legacy Employee widgets and requests no global metrics.
- Shared read-only Profile uses the verified self-data. Unavailable optional fields/invalid dates are omitted; `createdAt` is labelled Account created, not joining date. Shared logout clears only WorkNest token/user keys and reactive session state, then returns to `/`. Late responses cannot restore a logged-out session. A 401 for the current request token invalidates the session; 403 retains it for caller-level handling. Existing JWTs remain usable until expiration unless the account is disabled; client logout does not revoke a copied token.

See the [session verification guide](../development/employee-session.md) for test commands, file inventory and known limits. Employee Task/Quotation business workflows and the existing Admin Dashboard metrics defect are outside this group.

### Implemented delta — M1 Task integration

- Existing Task list/detail reads retain their assigned-record scope and human `TSK…` URL identifiers. `/employee/tasks` and `/employee/tasks/:taskId` now use those shared APIs, with My Tasks navigation and loading/empty/error/retry states. No Employee-directory or legacy role-specific API is needed for Task reads.
- PATCH `/api/tasks/:taskId/status` accepts only `{status}` and returns 200 `{message:"Task status updated",task}`. The central `TASK_STATUS_UPDATE` permission is granted to Admin and Employee; Employee still lacks `TASK_UPDATE`, create and delete. This narrow action implements approved D1 without opening the Admin PUT editor. Required authentication, current assignment/nondeleted scope and state rules are enforced in the service and database write.
- Employees can move `pending → in-progress → done`; current-status retries are no-ops. Admin can use all existing enum transitions, including reopening. Invalid status/body/transition is 400; extra fields on the status action are 403; missing or out-of-scope tasks are 404. A lost conditional write returns 409 with refresh guidance unless a fresh authorized lookup confirms the requested status already won.
- Status changes and Admin PUT bind the write to the read assignee, status, update timestamp and `deleted:false`. Reassignment preserves status unless Admin explicitly changes it. New/changed assignees must be active, nondeleted Employees; unchanged historical associations remain usable for Admin edits. Required text/date and status/priority inputs are validated before writes. Task schema and existing success envelopes remain unchanged.
- Both roles refetch through the shared Task hook after mutations and on manual/focus refresh. The Admin form normalizes populated assignee IDs and ISO dates, prefills the selected employee, and retains status/priority values. Employee controls offer only the next valid status and clear revoked detail data; delayed responses from a previous detail route are ignored.

See the [M1 Task verification report](../development/task-workflow.md) for file inventory, executed real-MongoDB/browser evidence and remaining limits. Quotation integration and Admin Dashboard repairs remain outside this milestone.

## 1. Common transport and identity

- Base path is `/api`; frontend uses VITE_BACKEND_URL and the shared [Axios client](../../frontEnd/src/api/axios.js). JSON request bodies except Product multipart uploads. `/uploads/*` serves public static product images, not a business API.
- Every mounted business endpoint requires `Authorization: Bearer <JWT>` except POST `/api/auth/login`. Registration requires authentication plus the existing Admin role guard. All other endpoints use their listed operation permission.
- Permission denial is 403 `{message,requiredPermissions:[...]}`. Invalid/missing session is 401 `{message}`. Current AppError failures return `{message}` with their status, typically 400 invalid input/state, 403 ownership denial, 404 missing record. Unmapped Mongoose cast/validation/duplicate-key errors and upload errors generally return 500. Unmounted routes return Express's default 404 rather than a documented JSON envelope.
- Correction: validate IDs/payloads, map expected validation failures to 400 and preserve permission/state/not-found distinctions. Keep existing envelopes compatible; no blanket response-format migration is proposed. Conditional state conflict responses need a documented 400/409 choice before implementation; current invalid quotation transitions use 400.
- IDs are not interchangeable. Values in payload refs are User/Customer/Product/Quotation Mongo ObjectIds. Several URL parameters are human business codes:

| Parameter | Current route meaning | Example |
|---|---|---|
| employee `:empId` | User.empId business code | `EMP001` |
| customer `:customerId` | Customer.customerId business code | `CUST001` |
| product `:productId` | Product.productId business code | `PRD001` |
| task `:taskId` | Task.taskId business code | `TSK001` |
| order `:orderId` | Order.orderId business code | `ORD001` |
| quotation `:quotationId` | Quotation._id, **not** Quotation.quotationId | Mongo ObjectId, not `QT0001` |

Populated references are objects containing `_id`; mutation references must be normalized to the `_id` string. Dates serialize as ISO timestamps; normalize to date-input format only at the form boundary. Never use empId instead of User._id to prove ownership.

Most list endpoints return arrays without pagination. Quotations return a paginated envelope. Keep current APIs; reuse frontend search/filter hooks for array-based modules instead of inventing parallel query infrastructure.

## 2. Auth and self profile

Sources: [auth routes](../../backEnd/src/modules/auth/auth.routes.js), [validation](../../backEnd/src/modules/auth/auth.validation.js), [service](../../backEnd/src/modules/auth/auth.service.js), [User](../../backEnd/src/models/user.model.js).

| Method / path | Auth / consumer | Request and validation now | Response / errors now |
|---|---|---|---|
| POST `/api/auth/login` | Public; both roles | `{email,password}`; email syntax, nonempty password; bcrypt verification | 200 `{message,token,user:{_id,name,email,role,permissions}}`; 400 validation/invalid credentials; 500 unexpected errors |
| POST `/api/auth/register` | JWT + authorizeRoles(admin); Admin | `{name,email,password,role?,phone?}`; name required, email valid, password >=8; validator role admin/user (incorrect), optional mobile phone | 201 `{message}`; 400 duplicate/validation; 403 nonadmin; model/other failures 500. Service/model double-hash defect |

Current login/session does not check active/nondeleted status. Prioritized correction retains the same API and resolves identity/permissions from the database, rejects inactive/deleted accounts at login and with existing tokens, aligns registration with `admin`/`employee`, and hashes a password once. Safe User fields must be selected/serialized for every direct and populated response, not just login.

**Proposed addition:** GET `/api/auth/me`, JWT required, no module permission, both roles, no body or client user ID. Safe response:

```json
{
  "user": {
    "_id": "<User ObjectId>",
    "name": "Employee name",
    "email": "employee@example.test",
    "role": "employee",
    "permissions": ["TASK_READ", "QUOTATION_READ"],
    "empId": "EMP001",
    "phone": "<optional>",
    "status": "active",
    "createdAt": "<ISO timestamp>"
  }
}
```

The permissions shown are abbreviated; real responses derive the full current map. Optional fields can be absent. 401 for unusable session. Existing login fields stay compatible; safe profile fields may be additive. D4 approves read-self only using this endpoint, without Employee-directory permission. No current PATCH profile, refresh, logout or register-as-public route exists; Profile writes remain deferred.

## 3. Employees (User directory)

Sources: [routes](../../backEnd/src/modules/employee/employee.routes.js), [controller](../../backEnd/src/modules/employee/employee.controller.js), [service](../../backEnd/src/modules/employee/employee.service.js), [repository](../../backEnd/src/modules/employee/employee.repository.js).

Every route is Admin-only under the current map; no employee ownership shortcut exists.

| Method / path | Permission | Request | Current success response / validation |
|---|---|---|---|
| GET `/api/employees` | EMPLOYEE_READ | None | 200 `User[]` excluding password; nondeleted, including Admin/inactive Users |
| GET `/api/employees/:empId` | EMPLOYEE_READ | Business code | 200 `User` with password removed; 404 missing/nonactive-by-deleted-flag |
| POST `/api/employees` | EMPLOYEE_CREATE | `{name,email,phone?,password,role?,status?}` | 201 raw created/restored User; generates empId on new user. 400 existing nondeleted email. User schema requires name/email/password, role enum, status enum, password >=6, phone max length 10 |
| PUT `/api/employees/:empId` | EMPLOYEE_UPDATE | Any of name/email/phone/password/role/status | 200 `{message}`; 404 missing; 400 duplicate email; truthy-field updates |
| DELETE `/api/employees/:empId` | EMPLOYEE_ARCHIVE | No body | 200 `{message}`; 404 missing; soft delete |

Correction: safe response projection on POST (currently can serialize password hash); focused payload validation in the existing empty employee.validation file if this path is touched. Do not change directory list into a self-profile API or filter administrators out of management views without approval. Assignment selectors must reject inactive/deleted/nonemployee assignees even though the directory can show them.

## 4. Customers

Sources: [routes](../../backEnd/src/modules/customer/customer.routes.js), [service](../../backEnd/src/modules/customer/customer.service.js), [model](../../backEnd/src/modules/customer/customer.model.js), [repository](../../backEnd/src/modules/customer/customer.repository.js).

| Method / path | Permission / role | Request | Current response / validation |
|---|---|---|---|
| GET `/api/customers` | CUSTOMER_READ; both | None | 200 `Customer[]`, all nondeleted, populated addedBy without safe User projection |
| PUT `/api/customers/:customerId` | CUSTOMER_UPDATE; Admin | Business code; `{name?,address?,contact?,gst?,email?,status?,companyType?}` | 200 `{message,customer}`; 404 missing; 400 duplicate email on change; truthy updates, no explicit enum/input validator |
| DELETE `/api/customers/:customerId` | CUSTOMER_ARCHIVE; Admin | Business code; no body | 200 `{message}`; 404 missing; soft delete |

Customer fields: `_id,customerId,name,address,contact,gst,email,status,companyType,addedBy,deleted,deletedAt,createdAt,updatedAt`. Only customerId and addedBy are schema-required; status/companyType are strings, not enforced enums. Service assigns updatedBy but the model does not attach the audit plugin, so that is not a dependable persisted audit field.

**Missing:** POST `/api/customers`, despite frontend createCustomerAPI and Admin/legacy Employee create UI. There is no active GET customer detail route. Do not invent a current create success envelope or claim the old controller is mounted. Safe addedBy projection is a security correction, independent of Customer Creation.

**D2 approved future direction / separate CC-1:** Employees must be able to acquire/create customers through the shared Customer API. Retain existing shared reads and quotation selection now; “read-only Employee Customer” is an interim scope boundary, not the long-term contract. CC-1 will mount shared POST `/api/customers`, assign CUSTOMER_CREATE to the permitted Employee role, derive addedBy from req.user rather than body identity, validate creation/deduplication and return a safe record usable by the existing quotation selector. Final payload/duplicate rules and response compatibility are reviewed within that separate issue; no route, permission grant or creation implementation is included in the current security/Task/Quotation groups. Employee update/archive rights are not implied by create. Product creation/edit/archive remain Admin-only; catalog reads stay shared.

## 5. Products

Sources: [routes](../../backEnd/src/modules/product/product.routes.js), [controller](../../backEnd/src/modules/product/product.controller.js), [model](../../backEnd/src/modules/product/product.model.js), [upload middleware](../../backEnd/src/middleware/image.middleware.js).

| Method / path | Permission / role | Request | Current response / validation |
|---|---|---|---|
| GET `/api/products` | PRODUCT_READ; both | None | 200 `Product[]`, entire catalog |
| POST `/api/products` | PRODUCT_CREATE; Admin | Multipart `{name,description,price,image?}` | 201 `{message}`; name/description/price required by model; image optional JPG/JPEG/PNG with permitted MIME, converted to WebP |
| PUT `/api/products/:productId` | PRODUCT_UPDATE; Admin | Business code; multipart name/description/price/image | 200 `{message,product}`; 404 missing; same upload processing |
| DELETE `/api/products/:productId` | PRODUCT_ARCHIVE; Admin | Business code | 200 `{message}`; 404 missing; actual hard delete plus attempted image cleanup |

Product fields: `_id,productId,name,description,image,price,createdAt,updatedAt`; no gstRate, owner, status or soft-delete fields. Service assigns audit IDs but model lacks audit plugin. Product price has no schema nonnegative minimum; product.validation is empty. Invalid image errors lack statusCode and return 500. Controller image cleanup path is relative to the module and does not match backend uploads location; record this as separate Product repair, not an Employee rewrite.

Historical quotation display must use item snapshots, not populated product.price/name. There is no Product tax configuration to use as a universal GST rule.

## 6. Tasks

Sources: [routes](../../backEnd/src/modules/task/task.routes.js), [controller](../../backEnd/src/modules/task/task.controller.js), [service](../../backEnd/src/modules/task/task.service.js), [repository](../../backEnd/src/modules/task/task.repository.js), [model](../../backEnd/src/modules/task/task.model.js).

| Method / path | Permission / role now | Request | Current response / rules |
|---|---|---|---|
| GET `/api/tasks` | TASK_READ; both | None; no backend pagination/filter parameters | 200 `Task[]`, all nondeleted, populated assignedTo/assignedBy with no User projection; **no employee scope** |
| POST `/api/tasks` | TASK_CREATE; Admin | `{assignedTo,assignedBy,title,description,dueDate,status?,priority?}` | 201 `{message,task:<title string>}`; generates taskId; trusts assignedBy; Mongoose required fields/enums/types only |
| PUT `/api/tasks/:taskId` | TASK_UPDATE; Admin | Business code; `{assignedTo?,title?,description?,dueDate?,status?,priority?}` | 200 `{message,task:<updated document>}`; 404 missing; truthy-field updates; any enum status transition |
| DELETE `/api/tasks/:taskId` | TASK_DELETE; Admin | Business code; no body | 200 `{message}`; 404 missing; soft delete |

Task fields: `_id,taskId,title,description,assignedTo,assignedBy,status,dueDate,priority,deleted,deletedAt,createdAt,updatedAt`. Required title/description/assignee/assigner/dueDate. Status `pending|in-progress|done`, priority `low|medium|high`. No comments/activity model. task.validation is empty. No active GET detail route.

**Proposed compatible contract:**

- GET list retains array response; repository scope is Admin all active / Employee assignedTo = actor._id. Safe assignee/assigner refs expose `_id,name,empId` and any specifically needed display fields only.
- Add GET `/api/tasks/:taskId` with TASK_READ and same scope; return `{task:<populated safe document>}`. Use existing getTaskById service with actor-aware lookup. 400 invalid parameter, 404 absent/out-of-scope, 403 permission denial.
- POST retains current response so Admin hook can continue refetching. Derive assignedBy from req.user; validate active employee assignee and fields. Body assignedBy is no authority.
- PUT retains current response. Admin keeps existing allowed editing fields; normalize populated references to raw IDs. D1 approves Employee `pending → in-progress → done`, same-status no-op, and Admin-controlled reassignment/reopening; reassignment preserves status. Employee gets existing TASK_UPDATE only when current assignment, **status-only** payload validation and state guards are implemented together. Reject attempted ownership/title/date/priority changes even if supplied beside valid status. Do not copy the Admin modal into Employee views.
- DELETE remains Admin-only; exclude soft-deleted tasks consistently from all reads/updates and define harmless repeated-delete behavior.

## 7. Quotations

Sources: [routes](../../backEnd/src/modules/quotation/quotation.routes.js), [controller](../../backEnd/src/modules/quotation/quotation.controller.js), [service](../../backEnd/src/modules/quotation/quotation.service.js), [validation](../../backEnd/src/modules/quotation/quotation.validation.js), [repository](../../backEnd/src/modules/quotation/quotation.repository.js).

All `:quotationId` parameters below are Mongo `_id`. Current controller grants Admin broad scope and otherwise checks employeeId against actor._id. Business number `quotationId` (`QT…`) is generated once and immutable through ordinary updates.

| Method / path | Permission / role | Request / state | Current success response |
|---|---|---|---|
| GET `/api/quotations` | QUOTATION_READ; both | page,limit,search,status; employee scope enforced | 200 `{message,quotations,total,page,limit,totalPages}`; headers only, populated refs |
| POST `/api/quotations` | QUOTATION_CREATE; both | Create payload below; DRAFT | 201 `{message,quotation:{...header,items}}` |
| GET `/api/quotations/:quotationId` | QUOTATION_READ; owner/Admin | No body | 200 `{message,quotation:{...header,items}}` |
| PUT `/api/quotations/:quotationId` | QUOTATION_UPDATE; owner/Admin | Edit payload below; DRAFT or REJECTED | 200 `{message,quotation:{...header,items}}` |
| POST `/api/quotations/:quotationId/submit` | QUOTATION_SUBMIT; owner/Admin | No body; DRAFT → SUBMITTED; stored items required | 200 `{message,quotation:<header>}` |
| POST `/api/quotations/:quotationId/approve` | QUOTATION_APPROVE; Admin | No body; SUBMITTED → APPROVED | 200 `{message,quotation:<header>}` |
| POST `/api/quotations/:quotationId/reject` | QUOTATION_REJECT; Admin | `{reason}` nonblank text; SUBMITTED → REJECTED | 200 `{message,quotation:<header>}` |
| POST `/api/quotations/:quotationId/reopen` | QUOTATION_UPDATE; owner/Admin | No body; REJECTED → DRAFT | 200 `{message,quotation:<header>}` |
| DELETE `/api/quotations/:quotationId` | QUOTATION_ARCHIVE; Admin | No body; currently no status restriction | 200 `{message}`; soft delete |

List: page coerced to integer >=1; limit coerced to 1..100, default 10. Search is case-insensitive quotation-number regex, not customer-name search. Status is an exact enum-style string but not explicitly validated at the list boundary. Empty list totalPages is 0. Preserve existing filters/pagination; scoped count and records must use the same query.

Create payload (all refs raw ObjectId strings):

```json
{
  "customerId": "<Customer._id>",
  "employeeId": "<optional Admin-assigned User._id>",
  "validUntil": "<optional future date>",
  "notes": "<optional text>",
  "items": [{
    "productId": "<Product._id>",
    "quantity": 1,
    "unitPrice": 100,
    "discountAmount": 0,
    "discountPercentage": 0,
    "gstRate": 0
  }]
}
```

Current create checks a nondeleted active customer and existing products, rejects duplicate product strings, and snapshots canonical product name/sku/description. Employee owner is forced to authenticated actor; Admin may supply employeeId, but its user reference is not validated. Create requires at least one item even for DRAFT. Frontend requires validity; backend allows it omitted.

**D7 draft proposal:** preserve the current commercially complete draft boundary for v1: customer, owner and at least one fully valid item. Empty/customerless/partial-item drafts remain unsupported and separately scoped. Keep optional validUntil in the API and the existing Admin form's stricter validity requirement; when supplied, validate it as a future date. At submit, revalidate stored commercial fields and supplied validity; do not introduce a new mandatory API date. No permissive schema migration, placeholder price/product or new draft endpoint is proposed.

Edit accepts optional customerId, employeeId, items, validUntil, notes; supplied items replace the entire set. Identity/number/status and totals are not arbitrary writable fields. Current defects: employees can reassign employeeId; changed customer is not checked for existence/activity; existing item name/description snapshots are enriched again from current products; missing/removed products break edits. Metadata-only notes validation is incomplete.

**Prioritized security correction:** reject Employee attempts to change employeeId before writing, even if other valid edit fields are supplied; preserve authoritative owner across updates. Admin assignment remains permitted on editable records with validated references. Keep current quotation-ID meaning, envelope shapes and Admin archive eligibility. A DRAFT-only backend archive restriction was not approved.

Validation now: integer quantity >0, finite nonnegative unit price; nonnegative amount discount <= line subtotal; percentage discount and GST 0..100; supplied validity future/parsable; notes text on create/item-validation path. Number coercion accepts `unitPrice:null` as 0 and `quantity:true` as 1. Malformed refs can produce 500. Correction: reject wrong numeric types/blank/nonfinite values before coercion, validate all mutation references and editable fields, and preserve existing snapshots for unchanged historical lines.

Header fields include customerId/employeeId, createdBy/updatedBy, status, subtotal, discountAmount/discountPercentage, taxableAmount, gstAmount/gstRate, grandTotal, validUntil, notes, approvedBy/At, rejectedBy/At/rejectionReason, deletion fields and timestamps. Header discount/GST defaults exist but totals are calculated from items; do not introduce a second header-level discount/tax operation. No submittedBy/At, terms field or customer snapshot exists.

Item fields include quotation ObjectId, productId, productName/sku/description snapshots, quantity/unitPrice, discountAmount/Percentage, gstRate/Amount, taxableAmount, lineTotal and timestamps. GET item productId may be a populated live Product or null after hard deletion; use stored commercial fields regardless. GET customer/employee/decision refs are safely selected; createdBy is not populated. Create/update and action responses may hold raw refs rather than GET display objects.

Backend line/header calculation is authoritative in intention, but mismatched defaults/rounding remain; see [pricing corrections](workflow-contracts.md#4-quotation-calculation-and-history-contract). Action response **does not include items**: refetch GET details rather than replacing a complete detail object with an action header. Filtered lists should refetch to correct membership/counts after actions.

**D7 pricing detail proposed for approval:** resolve omitted gstRate on newly supplied items to existing compatibility default 18, preserve explicit 0, reject null/blank/boolean/nonfinite rates, and preserve unchanged historical line rates. Resolve once before calculating/persisting; no Product tax configuration or universal GST claim. Use exact/scaled half-up cents, effective percentage-discount precedence and headers summed from stored components; normalize editable amount fields consistently and return those canonical amounts in the existing fields. The workflow document defines the single calculation order; no duplicate competing formula is introduced here.

**D6 retention detail proposed for approval:** keep existing status endpoints and rejection fields, but preserve the most recent reason/actor/date through reopen/resubmit/approval, replacing them on the next rejection. Current `/reopen` clears them. Retention changes those response values intentionally; consumers must use status for current rejection and label historical values “Most recent rejection.” Names/types/envelopes remain compatible, but review/test this semantic change with the shared Card/Table/details consumers. No full history or backfill. See [retention consequences](workflow-contracts.md#d6--consequences-and-minimum-retention-proposal).

Current sequential invalid transitions return 400; ownership 403; missing quote/product/customer 404; inactive create customer 400. Backend protects ordinary updates for SUBMITTED/APPROVED/CONVERTED. Repeated sequential submit/approve requests fail safely, but read/save is not conditional and header/items writes are not transactional. These tests do not yet prove concurrent safety.

D8 transaction support is unverified by repository inspection; do not change quotation persistence until the [verification gate](workflow-contracts.md#d8--transaction-verification-gate) passes. Denying unsafe owner changes and scoping reads can precede that persistence work.

**Missing:** active quotation conversion API and order creation API. A valid APPROVED → CONVERTED transition in validation alone is not a conversion operation.

## 8. Orders

Sources: [routes](../../backEnd/src/modules/order/order.routes.js), [controller](../../backEnd/src/modules/order/order.controller.js), [service](../../backEnd/src/modules/order/order.service.js), [repository](../../backEnd/src/modules/order/order.repository.js), [model](../../backEnd/src/modules/order/order.model.js).

| Method / path | Permission / role now | Request | Current response / limitations |
|---|---|---|---|
| GET `/api/orders` | ORDER_READ; both | None | 200 intended `Order[]`, all nondeleted; obsolete quotation total/products population; no employee scope |
| PUT `/api/orders/:orderId` | ORDER_UPDATE; Admin | Business code; `{status}` | 200 `{message}`; 404 missing; arbitrary string status, no transition validator |
| DELETE `/api/orders/:orderId` | ORDER_ARCHIVE; Admin | Business code; no body | 200 `{message}`; 404 missing; soft delete |
| GET `/api/orders/:orderId/download-pdf` | ORDER_READ; both | Business code | Intended PDF attachment; currently incompatible named generator export/function call and response-passing; no dependable successful response contract |
| GET `/api/orders/:orderId/download-csv` | ORDER_READ; both | Business code | Intended 200 `text/csv`, attachment `order-<id>.csv`; generator reads obsolete quotation.products/total |

Order stores quotationId ObjectId, addedBy User, customerSnapshot, productsSnapshot `{productId,name,price,quantity}`, totalSnapshot, status string, dispatch dates, deletion fields and timestamps. There is no uniqueness constraint on quotationId to prevent duplicate conversion; item snapshots do not include the full quotation discount/GST breakdown. Existing list/detail/export implementations do not consistently consume snapshots. Export queries do not exclude deleted or unauthorized records, and detailed addedBy is populated without a safe projection.

No POST Order or GET ordinary Order detail endpoint is mounted. Legacy create handler is not a safe conversion implementation. **D3 approved containment:** remove Employee ORDER_READ in the existing central role map and deny Employee GET list/PDF/CSV at the backend, including requests made with previously issued JWTs or cached browser permissions. Preserve Admin permissions, response envelopes and current routes. Employee Order ownership is still unresolved; re-enabling reads, repairing exports or creating conversion needs separately reviewed work. Do not promise Order readiness beyond protected approved quotation data and the existing traceability link.

## 9. Dashboard

Source: [routes](../../backEnd/src/modules/dashboard/dashboard.routes.js), [service](../../backEnd/src/modules/dashboard/dashboard.service.js).

GET `/api/dashboard/dashboard-metrics`, JWT + DASHBOARD_READ, both roles under current map, no payload. Intended 200 `{pendingTasks,quotationsGiven,confirmedOrders,products}`. Current pendingTasks counts nondeleted pending tasks globally; quotation count calls a nonexistent repository.countDocuments method, so the handler fails before completing. Order count uses all statuses/deleted records despite its label; products counts all. No Employee-scoped version exists. A mocked-repository probe reproduced the missing-method TypeError without a database.

**D5 approved direction:** preserve Admin card presentation and the four-field Admin response, correcting the existing repository-method failure without inventing an Order lifecycle. Deny Employee global metrics in the security stage until scoped metrics exist; retain the existing DASHBOARD_READ permission for scoped dashboard access. Backend actor/resource rules must distinguish the two experiences.

**Proposed compatible Employee response on the same GET route:** `{pendingTasks,quotationsGiven}`. pendingTasks counts only nondeleted pending Tasks assignedTo = req.user._id; quotationsGiven counts only nondeleted Quotations employeeId = req.user._id. No Product or Order company totals or fake zero placeholders. Role-dependent response shapes are explicit; Admin's existing keys stay intact. The Employee dashboard must consume this scoped response and show assigned Tasks/owned Quotations only, without legacy notification/order/customer-mutation widgets. This target is not implemented at this checkpoint.

## 10. Incompatible frontend integrations

| Caller | Current mismatch | Replacement after approval |
|---|---|---|
| EmployeeDashboard | GET `/api/employee/customers/:id`; employee customer POST button without permission or mounted POST | Assigned-task/owned-quotation dashboard; Customer create UI waits for separate CC-1, an approved long-term capability |
| EmployeeTaskManagement | GET/PUT/DELETE `/api/employee/tasks/*`; expects a status-updated task; no current Employee update/delete permission | Shared `/api/tasks` and proposed scoped detail; approved status-only PUT; no delete |
| EmployeeQuotationManagement | GET `/api/employee/quotation/:id`; old products/total and lower-case pending/approved/ordered; legacy POST `/api/employee/order` | Current shared QuotationManagement routes and uppercase lifecycle; conversion deferred |
| EmployeeOrderManagement | GET `/api/employee/order/:id`; `/login` redirect | Defer widget and deny unsafe Employee backend reads/exports; future owned API requires separate scope; `/` login |
| CustomerComboBox | GET `/api/admin/customers` or `/api/customers/:empId`, neither mounted GET | Shared customer API if this old component is used; quotation's current CustomerSelector already uses shared API |
| useTasks | Always calls `/api/employees`; maps populated assignedTo as though raw ID | Fetch directory only with capability; use safe populated names; normalize mutation refs |
| AddQuotation | Additional unconditional `/api/employees` request causes Employee 403; inline customerDetails are sent but not persisted | Capability-aware assignment fetch; read customer data from supported contract, separately decide snapshot/edit intent |
| QuotationWorkflowActions | Ignores role/permission for approval/rejection; own list hook doesn't refresh parent details | Shared API action callbacks, pending state, refetch parent details/list |
| Profile / axios / denied page | Missing self fields/API; 401 targets unregistered `/login`; denied dashboard targets Admin | Proposed `/me`, existing `/` login, role-aware navigation |

Do not restore `/api/admin/*` or `/api/employee/*` backend stacks. Current resource APIs plus resource policies serve both roles and a future mobile client. Current-user and task-details endpoints are the additions planned for the integration groups. Shared Customer POST is separate required CC-1 work. Existing route identifiers/body/envelope shapes and working Admin behavior remain the compatibility baseline; security restrictions, corrected calculated values and the proposed rejection-retention semantic are explicitly documented exceptions needing targeted checks.

## Implemented M2 quotation delta — 2026-10-16

The approved M2 implementation now supersedes the quotation defects recorded in the audit baseline above. Existing routes, permissions, request field names and response envelopes remain. Employee requests use the same service and records as Admin; M0 owner/creator restrictions remain authoritative.

- The D8 gate passed for the configured isolated local replica set before quotation persistence changed. The shared standalone service was preserved. [Evidence, lifecycle and recovery](../development/quotation-d8-verification.md) describe the explicit approval and verified backup/restore/commit/rollback/Admin regressions.
- Create/update validate real customer, owner and newly added product references, strict commercial types and commercially complete items. Supplied validity must be future; omitted API validity remains optional. New omitted item GST resolves to 18; explicit zero and historical GST remain zero when applicable.
- Exact scaled/decimal half-up pricing is authoritative. Canonical editable money remains numeric JSON with safe bounds; percentages keep existing Number precision and do not gain an arbitrary two-decimal restriction. Discount precedence, before-tax basis and stored-component header aggregation follow D7.
- Unchanged item snapshots/commercial components survive catalog rename/deletion and ordinary full-form saves. Deliberate commercial edits use corrected pricing. Historical inconsistent drafts require explicit review/revision before submit; no automatic historical repair or migration occurs.
- Quotation header/item persistence and detail snapshots are transactional. List/count share a consistent snapshot. All mutations condition on authorized scope, current owner/status/timestamp and revalidate after transaction retries. Repeated sequential transitions remain 400; detected stale conditional writes return 409. Item failures roll back completely; sequence gaps after rollback/retry are allowed.
- Submission revalidates stored completeness, references, validity and line/header pricing. New optional `submittedBy` (User) and `submittedAt` (Date) are recorded; legacy submission metadata is not fabricated.
- Reopen now retains `rejectionReason`, `rejectedBy` and `rejectedAt`. Resubmission/approval also preserve them; the next rejection replaces the latest event. Shared consumers label them “Most recent rejection.” No full revision history is added.
- GET safely populates `createdBy` and submission/review identities. A missing populated Product preserves its original ObjectId rather than becoming null. Stored item snapshot/commercial fields remain authoritative. Mutation/action refs may remain raw and action responses still omit items; clients refetch details after actions.
- Shared frontend form/list/details now enforce permitted/status-aware actions and refetching. They omit nonfunctional PDF/conversion controls. Protected approved snapshot data is ready for separately scoped Order conversion; no conversion API or Order feature is added.

See [M2 changes, file inventory and executed verification](../development/quotation-integration.md). Earlier architecture/audit statements describe the pre-implementation baseline, not current test results.

## Implemented M3 Customer/Product delta — 2026-10-16

CC-1 is now implemented through the existing shared Customer resource API and central permission map. This supersedes the missing/future Customer creation statements in the audit baseline above; it does not introduce Employee-specific backend services or creator-exclusive visibility.

| Endpoint | Permission and behavior | Response |
|---|---|---|
| POST `/api/customers` | CUSTOMER_CREATE; Admin and Employee; server-derived addedBy and business code | 201 `{message,customer}` |
| GET `/api/customers/:customerId` | CUSTOMER_READ; shared nondeleted record by existing business code `CUST…` | 200 safe Customer directly; 404 missing/archived |

GET list remains a raw nondeleted Customer array, including inactive records. Quotation selection continues accepting only permitted active customers. Admin PUT/DELETE routes, business-code identifiers and success envelopes are retained. Employee receives no CUSTOMER_UPDATE/ARCHIVE or Product mutation permissions.

Create accepts `{name,address?,contact?,gst?,email?,status?,companyType?}`. A nonblank name is required, matching the pre-existing shared form. Optional text fields accept omission/blank; a nonblank email must be syntactically valid. Omitted status/companyType default to active/dealer; new status values are active/inactive. Company type remains extensible optional text, including a supplied blank. No new mandatory address/contact/category, GST format, phone format, company identity or customer ownership assignment is introduced. Body-supplied addedBy, creator/audit, number, deletion and internal request fields cannot override server identity/state.

Optional `Idempotency-Key` (1..128 characters, letters/digits/underscore/dot/colon/hyphen) is scoped to the authenticated creator. Same key and canonical payload returns the same nonarchived customer with 201; changed payload or replay after archive returns 409. The shared UI uses a stable key for unchanged retries and starts a new intent on form/payload changes. Existing callers may omit the header. Without a key, exact-email duplicate checks still apply, while repeated name-only requests remain separate creation intents.

Two optional hidden Customer request-metadata fields and a partial unique actor/key index protect retries without backfilling legacy records. Customer creation is transactional on the verified D8 replica set: existing sequence allocation occurs first and serializes concurrent create/email checks. Replay can consume unused sequence values; customer numbers are never reassigned. Exact-email duplicate behavior remains 400 across archived records, without a unique-email migration, case-folding or automatic restoration. Legacy Admin update semantics are preserved rather than adding global email-uniqueness enforcement to every write path. Internal request metadata and sensitive User fields are excluded from create/replay/list/detail responses.

Product backend permissions, payloads and hard-delete behavior are unchanged. The existing Product model has no inactive/soft-delete/category/GST configuration; removed products are absent from new catalog selection. Employee `/employee/products` renders the existing shared Product module read-only. Shared quotation selectors/pricing/workflow/persistence remain unchanged, and historical item snapshots survive product edits/deletion. Customer reads remain live references, not a new historical customer snapshot.

Employee `/employee/customers` and `/employee/customers/:customerId` reuse the shared list/form/details; Admin gains an additive detail route without changing its existing management route. See [M3 implementation and executed verification](../development/customer-product-integration.md).
## Implemented M4 Order delta — 2026-10-17

The [M4 audit decisions](../development/order-integration-audit.md) were explicitly approved before implementation. This delta supersedes the original Order/conversion limitations above; existing Task/Quotation/Customer/Product contracts remain.

| Method / path | Permission / role | Request and response |
|---|---|---|
| POST `/api/quotations/:quotationId/convert` | ORDER_CREATE; Admin | Quotation Mongo `_id`, empty body. 201 `{message,order,quotation,replayed:false}` initially; a consistent active new conversion replays 200 with the same Order and `replayed:true`. Server loads all customer/product/commercial/audit data; overrides return 400. Non-APPROVED state returns 400; missing quotation 404; historical/archived link or stored-data review conflict 409. |
| GET `/api/orders` | ORDER_READ; Admin | Existing raw `Order[]`, nonarchived, with safe populated identities/source and saved snapshots. |
| GET `/api/orders/:orderId` | ORDER_READ; Admin | Business Order code; 200 `{order}`. Missing/archived 404. |
| PUT `/api/orders/:orderId` | ORDER_UPDATE; Admin | Existing `{status}`, additive optional `expectedStatus` and cancellation `reason`. 200 existing `{message}` plus authoritative `order`. Field overrides/invalid transitions 400; stale state/version 409; missing/archived 404. |
| DELETE `/api/orders/:orderId` | ORDER_ARCHIVE; Admin | Existing soft archive and `{message}`; conditional current-state write. Archived records remain duplicate-conversion blockers. |
| GET `/api/orders/:orderId/download-pdf` | ORDER_READ; Admin | Working 200 PDF attachment `order-<id>.pdf`, generated from Order snapshots. |
| GET `/api/orders/:orderId/download-csv` | ORDER_READ; Admin | Working 200 CSV attachment `order-<id>.csv`, quoted stored snapshot values. |

All routes require live authentication (401 otherwise); Employees remain forbidden (403) for conversion and every Order action under D3. Services independently enforce Admin permission. No direct Order POST was active or removed, and the dormant Employee creation handler stays unmounted.

Order response fields are additive: `sourceType: quotation_conversion`, `quotationNumber`, full commercial line/header fields, frozen Customer reference/details, status audit/fulfillment dates and server-derived `allowedTransitions`. Existing product `price`, `totalSnapshot`, snapshots, order code and ordinary envelopes remain. Conversion uses the verified transaction helper for quotation status, sequence and Order creation; no client-supplied prices/status/identity are accepted.

The unique quotation constraint covers only newly marked conversions, including archived ones. All existing Order links are checked before conversion, including unmarked historical records. Legacy missing discount/GST components remain absent and display `Unavailable`; no historical repricing/backfill occurs. See [workflow rules](workflow-contracts.md#implemented-m4-order-workflow--2026-10-17) and [implementation/test evidence](../development/order-integration.md).
