const path = require("path");
const fs = require("fs");
const ProductService = require("./product.service");

exports.addProduct = async (req, res) => {
    const { name, description, price } = req.body;
    const image = req.file ? req.file.filename : "";

    await ProductService.addProduct(
      { name, description, price, image },
      req.user._id
    );

    res.status(201).json({ message: "Product added successfully" });
};

exports.getProducts = async (req, res) => {
  const products = await ProductService.getProducts();
  res.status(200).json(products);
};

exports.updateProduct = async (req, res) => {

    const { productId } = req.params;
    const { name, description, price } = req.body;

    const product = await ProductService.getProductById(productId);

    const updatedData = {
      name,
      description,
      price,
    };

    if (req.file) {
      // delete old image if it exists
      if (product.image) {
        const oldImagePath = path.join(
          __dirname,
          "../../uploads",
          product.image
        );
        if (fs.existsSync(oldImagePath)) {
          fs.unlink(oldImagePath, (err) => {
            if (err) console.error("Error deleting old image:", err);
          });
        }
      }

      // assign new image filename
      updatedData.image = req.file.filename;
    }

    const updatedProduct = await ProductService.updateProduct(
      productId,
      updatedData,
      req.user._id
    );

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
};

exports.deleteProduct = async (req, res) => {
    const { productId } = req.params;

    const product = await ProductService.getProductById(productId);

    await ProductService.deleteProduct(productId);

    if (product.image) {
      const imagePath = path.join(__dirname, "../../uploads", product.image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Error deleting image:", err);
          // optional: don't return error here, because product already deleted
        }
      });
    }

    res.status(200).json({ message: "Product and image deleted successfully" });
};
