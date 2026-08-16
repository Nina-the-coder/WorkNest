const express = require("express");
const ProductController = require("./product.controller");
const { upload, convertToWebP } = require("../../middleware/image.middleware");
const { verifyToken } = require("../../middleware/auth.middleware");
const { requirePermission } = require("../../middleware/permission.middleware");
const PERMISSIONS = require("../../utils/permissions");

const router = express.Router();

// Add product: Requires PRODUCT_CREATE permission
router.post(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.PRODUCT_CREATE),
  upload.single("image"),
  convertToWebP,
  ProductController.addProduct,
);

// Get all products: Requires PRODUCT_READ permission
router.get(
  "/",
  verifyToken,
  requirePermission(PERMISSIONS.PRODUCT_READ),
  ProductController.getProducts,
);

// Update product: Requires PRODUCT_UPDATE permission
router.put(
  "/:productId",
  verifyToken,
  requirePermission(PERMISSIONS.PRODUCT_UPDATE),
  upload.single("image"),
  convertToWebP,
  ProductController.updateProduct,
);

// Delete product: Requires PRODUCT_ARCHIVE permission
router.delete(
  "/:productId",
  verifyToken,
  requirePermission(PERMISSIONS.PRODUCT_ARCHIVE),
  ProductController.deleteProduct,
);

module.exports = router;
