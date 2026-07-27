const express = require("express");
const router = express.Router();
const QuotationController = require("./quotation.controller");

// quotation routes
// router.get("/", QuotationController.listQuotation);
router.get("/", QuotationController.getAllQuotations);
// router.post("/", QuotationController.submitQuotation);
// router.put("/:quotationId", QuotationController.updateQuotationStatus);
// router.delete("/:quotationId", QuotationController.deleteQuotation);

module.exports = router;