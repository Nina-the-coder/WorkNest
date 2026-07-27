const express = require("express");
const ProductController = require("./product.controller");
const router = express.Router();
const { upload, convertToWebP } = require("../../middleware/image.middleware");
const { verifyToken } = require("../../middleware/auth.middleware");

// product routes
router.post("/", verifyToken , upload.single("image"), convertToWebP, ProductController.addProduct);
router.get("/", ProductController.getProducts);
router.put(
  "/:productId",
    verifyToken,
  upload.single("image"),
  convertToWebP,
  ProductController.updateProduct,
);
router.delete("/:productId", verifyToken, ProductController.deleteProduct);

module.exports = router;