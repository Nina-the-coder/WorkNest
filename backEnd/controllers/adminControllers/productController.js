const Product = require("../../models/Product");
const getNextSequence = require("../../utils/getNextSequence");

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
    const updatedData = {
      name,
      description,
      price,
    };

    if (req.file) {
      updatedData.image = req.file.filename;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { productId: productId },
      updatedData,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res
      .status(200)
      .json({ message: "Product Updaated...", product: updatedProduct });
  } catch (err) {
    res.status(500).json({
      message: "Error in updating the product...",
      error: err.message,
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const deleted = await Product.deleteOne({ productId });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "ERror in deleting the product", error: err.message });
  }
};
