const Product = require("./product.model");

exports.createProduct = (data) => {
  return Product.create(data);
};

exports.findAll = () => {
  return Product.find();
};

exports.findByProductId = (productId) => {
  return Product.findOne({ productId });
};

exports.saveProduct = (product) => {
  return product.save();
};

exports.deleteByProductId = (productId) => {
  return Product.deleteOne({ productId });
};

exports.countDocuments = (filter) => {
  return Product.countDocuments(filter);
};