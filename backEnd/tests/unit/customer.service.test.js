const CustomerService = require("../../src/modules/customer/customer.service");
const CustomerRepository = require("../../src/modules/customer/customer.repository");
const AppError = require("../../src/utils/AppError");
const getNextSequence = require("../../src/utils/getNextSequence");

jest.mock("../../src/modules/customer/customer.repository");
jest.mock("../../src/utils/getNextSequence");

describe("Customer Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCustomer", () => {
    const actor = { _id: "507f1f77bcf86cd799439011", role: "employee" };
    beforeEach(() => {
      CustomerRepository.runInTransaction.mockImplementation(operation => operation("session"));
      CustomerRepository.findByCreateRequest.mockResolvedValue(null);
      CustomerRepository.findByEmail.mockResolvedValue(null);
      CustomerRepository.createCustomer.mockImplementation(async data => data);
      getNextSequence.mockResolvedValue(101);
    });

    test("uses actual actor, existing defaults and optional session sequence", async () => {
      const created = await CustomerService.createCustomer({ name: " New customer ", addedBy: "forged", deleted: true, customerId: "FORGED" }, actor, "request-1");
      expect(created).toMatchObject({ name: "New customer", status: "active", companyType: "dealer", customerId: "CUST101", addedBy: actor._id });
      expect(created.deleted).toBeUndefined();
      expect(getNextSequence).toHaveBeenCalledWith("customerId", "session");
      expect(CustomerRepository.createCustomer).toHaveBeenCalledWith(expect.objectContaining({ createRequestKey: "request-1" }), "session");
    });

    test("rejects missing actor, forbidden role and invalid input before persistence", async () => {
      await expect(CustomerService.createCustomer({ name: "Customer" }, null)).rejects.toMatchObject({ statusCode: 401 });
      await expect(CustomerService.createCustomer({ name: "Customer" }, { ...actor, role: "unknown" })).rejects.toMatchObject({ statusCode: 403 });
      await expect(CustomerService.createCustomer({ name: " " }, actor)).rejects.toMatchObject({ statusCode: 400 });
      await expect(CustomerService.createCustomer({ name: "Customer", email: "invalid" }, actor)).rejects.toMatchObject({ statusCode: 400 });
      expect(CustomerRepository.createCustomer).not.toHaveBeenCalled();
    });

    test("retains the existing duplicate email error", async () => {
      CustomerRepository.findByEmail.mockResolvedValue({ deleted: true });
      await expect(CustomerService.createCustomer({ name: "Customer", email: "same@test.com" }, actor)).rejects.toMatchObject({ message: "Email already in use", statusCode: 400 });
      expect(CustomerRepository.createCustomer).not.toHaveBeenCalled();
    });

    test("returns the same customer on replay and rejects changed or archived replays", async () => {
      const first = await CustomerService.createCustomer({ name: "Customer" }, actor, "stable");
      CustomerRepository.findByCreateRequest.mockResolvedValue(first);
      expect(await CustomerService.createCustomer({ name: "Customer" }, actor, "stable")).toBe(first);
      await expect(CustomerService.createCustomer({ name: "Different customer" }, actor, "stable")).rejects.toMatchObject({ statusCode: 409 });
      CustomerRepository.findByCreateRequest.mockResolvedValue({ ...first, deleted: true });
      await expect(CustomerService.createCustomer({ name: "Customer" }, actor, "stable")).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  test("detail uses business code and reports missing records", async () => {
    const customer = { customerId: "CUST101", name: "Customer" };
    CustomerRepository.findCustomerDetails.mockResolvedValueOnce(customer).mockResolvedValueOnce(null);
    expect(await CustomerService.getCustomerById("CUST101")).toBe(customer);
    await expect(CustomerService.getCustomerById("missing")).rejects.toMatchObject({ statusCode: 404 });
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
