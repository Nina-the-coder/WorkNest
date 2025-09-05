const Product = require("../../models/Product");
const getNextSequence = require("../../utils/getNextSequence");
const path = require("path");
const fs = require("fs");

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price } = req.body;

    const nextProductNumber = await getNextSequence("product");
    const newProductId = `PRD${String(nextProductNumber).padStart(3, "0")}`;

    const newProduct = new Product({
      productId: newProductId,
      name,
      description,
      image: req.file ? req.file.filename : "",
      price,
    });

    await newProduct.save();
    res
      .status(201)
      .json({ message: "Product added successfully", product: newProduct });
  } catch (err) {
    console.error("Error in adding the product", err);
    res.status(500).json({ message: "Server Error...." });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "error in fetching products", error: err });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, price } = req.body;

    // find the existing product first
    const product = await Product.findOne({ productId });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

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

    const updatedProduct = await Product.findOneAndUpdate(
      { productId },
      updatedData,
      { new: true }
    );

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Error in updating product:", err);
    res.status(500).json({
      message: "Error in updating the product",
      error: err.message,
    });
  }
};
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // find the product first to know which image to delete
    const product = await Product.findOne({ productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // delete product from DB
    await Product.deleteOne({ productId });

    // if product has an image, delete it from uploads folder
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
  } catch (err) {
    res.status(500).json({
      message: "Error in deleting the product",
      error: err.message,
    });
  }
};
