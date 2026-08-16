const express = require("express");
const router = express.Router();
const { verifyToken } = require("../../middleware/auth.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");
const PERMISSIONS = require("../../utils/permissions");
const QuotationController = require("./quotation.controller");

/**
 * GET /api/quotations
 * List all quotations with pagination and filters
 * Requires: QUOTATION_READ permission
 */
router.get(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.QUOTATION_READ),
  QuotationController.listQuotations,
);

/**
 * POST /api/quotations
 * Create new quotation
 * Requires: QUOTATION_CREATE permission
 */
router.post(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.QUOTATION_CREATE),
  QuotationController.createQuotation,
);

/**
 * GET /api/quotations/:quotationId
 * Get quotation details
 * Requires: QUOTATION_READ permission
 */
router.get(
  "/:quotationId",
  verifyToken,
  requirePermission(PERMISSIONS.QUOTATION_READ),
  QuotationController.getQuotation,
);

/**
 * PUT /api/quotations/:quotationId
 * Update draft quotation
 * Requires: QUOTATION_UPDATE permission
 */
router.put(
  "/:quotationId",
  verifyToken,
  requirePermission(PERMISSIONS.QUOTATION_UPDATE),
  QuotationController.updateQuotation,
);

/**
 * POST /api/quotations/:quotationId/submit
 * Submit quotation for approval
 * Requires: QUOTATION_SUBMIT permission
 */
router.post(
  "/:quotationId/submit",
  verifyToken,
  requirePermission(PERMISSIONS.QUOTATION_SUBMIT),
  QuotationController.submitQuotation,
);

/**
 * POST /api/quotations/:quotationId/approve
 * Approve submitted quotation
 * Requires: QUOTATION_APPROVE permission
 */
router.post(
  "/:quotationId/approve",
  verifyToken,
  requirePermission(PERMISSIONS.QUOTATION_APPROVE),
  QuotationController.approveQuotation,
);

/**
 * POST /api/quotations/:quotationId/reject
 * Reject submitted quotation with reason
 * Requires: QUOTATION_REJECT permission
 */
router.post(
  "/:quotationId/reject",
  verifyToken,
  requirePermission(PERMISSIONS.QUOTATION_REJECT),
  QuotationController.rejectQuotation,
);

router.post(
  "/:quotationId/reopen",
  verifyToken,
  requirePermission(PERMISSIONS.QUOTATION_UPDATE),
  QuotationController.reopenQuotation,
);

/**
 * DELETE /api/quotations/:quotationId
 * Delete quotation (soft delete)
 * Requires: QUOTATION_ARCHIVE permission
 */
router.delete(
  "/:quotationId",
  verifyToken,
  requirePermission(PERMISSIONS.QUOTATION_ARCHIVE),
  QuotationController.deleteQuotation,
);

module.exports = router;
