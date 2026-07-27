const CustomerService = require("../../src/modules/customer/customer.service");
const CustomerRepository = require("../../src/modules/customer/customer.repository");
const AppError = require("../../src/utils/AppError");

jest.mock("../../src/modules/customer/customer.repository");

describe("Customer Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllCustomers", () => {
    test("should return all customers", async () => {
      const mockCustomers = [{ name: "Customer1" }, { name: "Customer2" }];

      CustomerRepository.findAllCustomers.mockResolvedValue(mockCustomers);

      const result = await CustomerService.getAllCustomers();

      expect(CustomerRepository.findAllCustomers).toHaveBeenCalled();
      expect(result).toEqual(mockCustomers);
    });
  });

  describe("deleteCustomer", () => {
    test("should delete customer successfully", async () => {
      const mockCustomer = {
        deleted: false,
        save: jest.fn(),
      };

      CustomerRepository.findActiveByCustomerId.mockResolvedValue(mockCustomer);
      CustomerRepository.save.mockResolvedValue(mockCustomer);

      await CustomerService.deleteCustomer("CUST001", "user123");

      expect(mockCustomer.deleted).toBe(true);
      expect(CustomerRepository.save).toHaveBeenCalledWith(mockCustomer);
    });

    test("should throw error if customer not found", async () => {
      CustomerRepository.findActiveByCustomerId.mockResolvedValue(null);

      await expect(
        CustomerService.deleteCustomer("CUST001", "user123"),
      ).rejects.toThrow(AppError);
    });
  });

  describe("updateCustomer", () => {
    test("should update customer successfully", async () => {
      const mockCustomer = {
        name: "Old Name",
        email: "old@test.com",
      };

      CustomerRepository.findActiveByCustomerId.mockResolvedValue(mockCustomer);
      CustomerRepository.save.mockResolvedValue(mockCustomer);

      const updatedData = {
        name: "New Name",
        address: "New Address",
      };

      const result = await CustomerService.updateCustomer(
        "CUST001",
        updatedData,
        "user123",
      );

      expect(mockCustomer.name).toBe("New Name");
      expect(mockCustomer.address).toBe("New Address");

      expect(CustomerRepository.save).toHaveBeenCalled();

      expect(result).toEqual(mockCustomer);
    });

    test("should throw error if customer not found", async () => {
      CustomerRepository.findActiveByCustomerId.mockResolvedValue(null);

      await expect(
        CustomerService.updateCustomer("CUST001", {}, "user123"),
      ).rejects.toThrow(AppError);
    });

    test("should throw error if email already exists", async () => {
      const mockCustomer = {
        email: "old@test.com",
      };

      CustomerRepository.findActiveByCustomerId.mockResolvedValue(mockCustomer);

      CustomerRepository.findByEmail.mockResolvedValue({
        email: "new@test.com",
      });

      await expect(
        CustomerService.updateCustomer(
          "CUST001",
          { email: "new@test.com" },
          "user123",
        ),
      ).rejects.toThrow(AppError);
    });
  });
});
