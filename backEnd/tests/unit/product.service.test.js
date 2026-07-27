const productService = require("../../src/modules/product/product.service");
const productRepo = require("../../src/modules/product/product.repository");
const getNextSequence = require("../../src/utils/getNextSequence");
const AppError = require("../../src/utils/AppError");

jest.mock("../../src/modules/product/product.repository");
jest.mock("../../src/utils/getNextSequence");

describe("Product Service", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addProduct", () => {

    test("should create a product with generated productId", async () => {

      getNextSequence.mockResolvedValue(1);

      const data = {
        name: "Laptop",
        description: "High performance",
        price: 50000,
        image: "image.jpg"
      };

      productRepo.createProduct.mockResolvedValue({
        productId: "PRD001",
        ...data
      });

      const result = await productService.addProduct(data, "user123");

      expect(getNextSequence).toHaveBeenCalledWith("product");
      expect(productRepo.createProduct).toHaveBeenCalled();
      expect(result.productId).toBe("PRD001");

    });

  });

  describe("getProducts", () => {

    test("should return all products", async () => {

      const products = [{ name: "Laptop" }];

      productRepo.findAll.mockResolvedValue(products);

      const result = await productService.getProducts();

      expect(productRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(products);

    });

  });

  describe("getProductById", () => {

    test("should return product", async () => {

      const product = { name: "Laptop" };

      productRepo.findByProductId.mockResolvedValue(product);

      const result = await productService.getProductById("PRD001");

      expect(result).toEqual(product);

    });

    test("should throw error if product not found", async () => {

      productRepo.findByProductId.mockResolvedValue(null);

      await expect(
        productService.getProductById("PRD001")
      ).rejects.toThrow(AppError);

    });

  });

  describe("updateProduct", () => {

    test("should update product successfully", async () => {

      const mockProduct = {
        name: "Old Laptop",
        price: 40000
      };

      productRepo.findByProductId.mockResolvedValue(mockProduct);
      productRepo.saveProduct.mockResolvedValue(mockProduct);

      const result = await productService.updateProduct(
        "PRD001",
        { price: 50000 },
        "admin123"
      );

      expect(mockProduct.price).toBe(50000);
      expect(productRepo.saveProduct).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);

    });

    test("should throw error if product not found", async () => {

      productRepo.findByProductId.mockResolvedValue(null);

      await expect(
        productService.updateProduct("PRD001", {}, "admin123")
      ).rejects.toThrow(AppError);

    });

  });

  describe("deleteProduct", () => {

    test("should delete product", async () => {

      const product = { productId: "PRD001" };

      productRepo.findByProductId.mockResolvedValue(product);
      productRepo.deleteByProductId.mockResolvedValue(true);

      const result = await productService.deleteProduct("PRD001");

      expect(productRepo.deleteByProductId).toHaveBeenCalledWith("PRD001");
      expect(result).toBe(true);

    });

    test("should throw error if product not found", async () => {

      productRepo.findByProductId.mockResolvedValue(null);

      await expect(
        productService.deleteProduct("PRD001")
      ).rejects.toThrow(AppError);

    });

  });

});