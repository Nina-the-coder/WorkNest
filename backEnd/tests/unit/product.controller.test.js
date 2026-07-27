const ProductController = require("../../src/modules/product/product.controller");
const ProductService = require("../../src/modules/product/product.service");

const fs = require("fs");

jest.mock("../../src/modules/product/product.service");
jest.mock("fs");

describe("Product Controller", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("addProduct should create product", async () => {

    const req = {
      body: { name: "Laptop", price: 50000 },
      file: { filename: "image.jpg" },
      user: { _id: "admin123" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    ProductService.addProduct.mockResolvedValue();

    await ProductController.addProduct(req, res);

    expect(ProductService.addProduct).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);

  });

  test("getProducts should return products", async () => {

    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const products = [{ name: "Laptop" }];

    ProductService.getProducts.mockResolvedValue(products);

    await ProductController.getProducts(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(products);

  });

  test("updateProduct should update product", async () => {

    const req = {
      params: { productId: "PRD001" },
      body: { name: "Updated Laptop" },
      file: null,
      user: { _id: "admin123" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const product = { image: "" };

    ProductService.getProductById.mockResolvedValue(product);
    ProductService.updateProduct.mockResolvedValue(product);

    await ProductController.updateProduct(req, res);

    expect(ProductService.updateProduct).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);

  });

  test("deleteProduct should delete product", async () => {

    const req = {
      params: { productId: "PRD001" },
      user: { _id: "admin123" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const product = { image: "image.jpg" };

    ProductService.getProductById.mockResolvedValue(product);
    ProductService.deleteProduct.mockResolvedValue();

    await ProductController.deleteProduct(req, res);

    expect(ProductService.deleteProduct).toHaveBeenCalledWith("PRD001");
    expect(res.status).toHaveBeenCalledWith(200);

  });

});