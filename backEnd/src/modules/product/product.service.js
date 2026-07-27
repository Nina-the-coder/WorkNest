const productRepo = require("./product.repository");
const AppError = require("../../utils/AppError");
const getNextSequence = require("../../utils/getNextSequence");

exports.addProduct = async (data, userId) => {
  const { name, description, price, image } = data;

  const nextProductNumber = await getNextSequence("product");
  const newProductId = `PRD${String(nextProductNumber).padStart(3, "0")}`;

  return productRepo.createProduct({
    productId: newProductId,
    name,
    description,
    image: image || "",
    price,
    createdBy: userId,
    updatedBy: userId,
  });
};

exports.getProducts = async () => {
  return productRepo.findAll();
};

exports.getProductById = async (productId) => {
  const product = await productRepo.findByProductId(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

exports.updateProduct = async (productId, data, userId) => {
  const { name, description, price, image } = data;

  const product = await productRepo.findByProductId(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = price;
  if (image !== undefined) product.image = image;

  product.updatedBy = userId;

  return productRepo.saveProduct(product);
};

exports.deleteProduct = async (productId) => {
  const product = await productRepo.findByProductId(productId);

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return productRepo.deleteByProductId(productId);
};