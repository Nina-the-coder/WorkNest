# M4 Order integration: current-state audit and approval checkpoint

Audited 2026-10-16; all three decisions below were explicitly approved on 2026-10-17. The findings and test counts below preserve the **preimplementation baseline**. No M4 runtime changes had been made at that original checkpoint. The subsequent [M4 implementation and verification report](order-integration.md) records the completed changes. Earlier milestone changes remain in the working tree; nothing is staged or committed.

## Verified current state

| Area | Existing implementation | Gap |
|---|---|---|
| Order model | `backEnd/src/modules/order/order.model.js`: unique/sparse orderId, required quotationId, customerSnapshot, productsSnapshot `{productId,name,price,quantity}`, totalSnapshot, free-string status, dispatch dates, soft deletion | Missing full discount/GST/component snapshots, conversion uniqueness and fulfillment rules |
| Creation/conversion | No mounted POST Order or quotation conversion action; `src/app.js` mounts current module routes only | Add one Admin conversion action using current Quotation/Order services and verified transactions |
| Legacy creation | Unmounted `backEnd/controllers/employeeController.js:addOrder`, referenced only by unmounted employeeRoutes; obsolete quotation.products/total and body creator | Preserve dormant files; do not reactivate. Reuse `order` sequence and `ORD` + 3-digit convention. No functioning direct creation API was found |
| Existing live APIs | GET list, PUT status, DELETE soft archive, GET PDF/CSV; business orderId path parameters; Admin-only central Order permissions | No ordinary detail GET; obsolete quotation.products/total population; archived detail/export lookups not consistently excluded |
| Admin UI | Existing OrderManagement, cards/list/preview, filters, API and hook; `/admin/orders` | Missing deep-linked details, complete commercial breakdown, reliable refresh/error handling, valid transition controls and approved-quotation conversion action |
| Statuses | UI values `confirm`, `dispatched`, `delivered`, `closed`; model permits any string, validation empty | No approved transitions, closed meaning, cancellation, reopen or manufacturing policy. Test fixtures also contain pending and allow direct dispatch; those are not a business specification |
| PDF/CSV | Existing download controls/generators | PDF has a real import/export and response mismatch, plus obsolete fields; CSV reads obsolete fields and lacks proper escaping |
| Employee access | Existing D3 central map grants no Order permission and no Employee Order route is mounted | Retain backend denial for conversion, list/detail, status, archive and exports |

The four approved architecture contracts and M2/M3 reports were read. Existing Customer data in a quotation remains a live reference; only Product/commercial line values have historical snapshots. Order code cannot reconstruct approval-time Customer details that were never stored. Product hard deletion must remain unchanged; conversion/details/exports must use persisted quotation/order snapshots, not current Product prices/names.

## Read-only configured-data preflight

The exact ignored backend environment reaches MongoDB 8.2.2 `worknest-dev`, writable PRIMARY with logical sessions. The existing D8 transaction-capable topology remains available; no shared MongoDB service restart/configuration change was made.

- Three existing Orders: two active and one archived; statuses delivered/dispatched/confirm, one each.
- **ORD001, ORD002 and ORD003 all reference the same missing quotation.** ORD001 is archived. None of their source references resolves among the current twelve quotations.
- A global unique index on quotationId would fail because that duplicate group includes all three Orders. The historical records cannot be safely reconciled to current quotations automatically.
- Existing customer/product/name/quantity/price/total snapshots remain usable. Discount, GST and component totals were never saved; display those as unavailable, rather than inventing zeros or repricing.
- Existing order number/counter convention is aligned: ORD001–ORD003, `order` counter 3, next ORD004, no collision.
- Current quotations: DRAFT 3, SUBMITTED 3, APPROVED 5, REJECTED 1, CONVERTED 0. The five approved records have complete stored items and valid current customer/product references; none has an Order.

The detailed sanitized ID/reason report is mode 0600 and Git ignored at `.worknest-local/reviews/m4-order-compatibility-20261016.json`. Inspection used raw MongoDB reads, without model initialization, index creation, mutation services or fixture writes.

## Decisions approved 2026-10-17

The user approved the proposed fulfillment/cancellation rules, preservation of legacy Orders with uniqueness for new conversions, and conversion-time Customer snapshots. Proposal language below is retained as the original decision record; these three policies now govern the implementation.

### 1. Fulfillment and cancellation

Recommended minimal v1 policy, preserving existing status tokens:

```text
new quotation conversion starts at confirm
pending → confirm → dispatched → delivered → closed
pending / confirm → cancelled (reason required)
```

`closed` means administrative completion after delivery, with no accounting/payment implication. closed/cancelled are terminal; delivered cannot be cancelled or reopened. No backward moves, skips or manufacturing states are added. `pending` is recognized for compatible existing/direct records, while conversion starts at the dormant creation convention confirm. This intentionally replaces unrestricted status-string updates; it needs business approval before enforcement. Existing archived records remain archived and no status migration/backfill is proposed.

### 2. Legacy preservation and conversion uniqueness

Recommended: preserve all three legacy Orders unchanged and flag their missing/duplicated quotation link in read-only details. Do not fabricate source records or discount/tax history.

Use an optional server-controlled marker for new quotation conversions and a partial unique quotationId index covering that marked set. This prevents duplicate new conversions without applying a failing global constraint to historical data. Conversion also checks **all** existing Orders, including archived/unmarked ones, and refuses conflicting legacy links rather than choosing an arbitrary record. Archived orders never free a quotation for another conversion. Automatic legacy deduplication/relinking is outside this milestone.

The marker/index is a proposed concrete compatibility strategy, not an applied schema change. An alternative is to pause for separately approved legacy-data reconciliation before enforcing a global unique quotation link.

### 3. Customer snapshot boundary

Recommended: snapshot the Customer document linked by the approved quotation **at conversion time**, including an existing archived Customer record, without reactivation or substitution. Freeze it in the Order thereafter. All item prices/names/quantities/discounts/taxes/totals come directly from persisted approved quotation values, even when a live Product was changed/deleted. Reject conversion if the Customer record is entirely missing. No approval-time Customer snapshot or historical reconstruction is invented.

If approval-time Customer details are required instead, that needs an explicitly reviewed additive quotation approval snapshot and a policy for already-approved legacy records whose original details are unavailable.

## Minimal implementation order after approval

1. **M4.1:** Add one shared Admin conversion action in the existing module architecture, full optional Order snapshot fields preserving legacy shape, approved partial unique constraint, authenticated audit identity and atomic Order + CONVERTED transaction. Repeated/concurrent conversion returns or identifies the same new Order safely; injected failures roll back both records. Existing orders remain readable.
2. **M4.2:** Repair the current Admin list/preview, add business-code Order Details, source quotation navigation and the approved permission/state transition actions. Use saved amounts; no dynamic Product recalculation or fake historical discount/tax data.
3. **M4.3:** Add actual HTTP/replica-set integrity, duplicate/concurrency/rollback/archived-reference and Employee-denial tests, plus source/snapshot consistency and safe identity serialization.
4. **M4.4:** Separately fix the verified small PDF integration mismatch using the existing basic template and stored snapshots; align CSV fields/escaping. No branding redesign. Verify real downloadable bytes and error behavior.
5. **M4.5:** Run focused/full regressions and actual Admin/Employee browser workflows on a transaction-capable disposable development database, including normal startup compatibility and cleanup. Stop after M4; no Order Employee access or Dashboard/reporting work.

## Executed audit checks

- Existing Order service/controller tests: **12 passed, 1 failed**. Failure reproduced at `backEnd/tests/unit/order.service.test.js:100`, `generateOrderPdf.mockResolvedValue is not a function`.
- Actual PDF mismatch is confirmed in source: generator exports `{generateOrderPdf(order,res)}`, service imports/calls the object as a function and ignores controller-supplied res. Both PDF/CSV reference obsolete quotation.products/total. This is not merely a stale mock.
- Read-only topology/data/index/counter/reference preflight passed and exposed the compatibility issues above.
- No M4 implementation tests/browser checks are claimed. No runtime changes, commits or merges were made at this checkpoint.
