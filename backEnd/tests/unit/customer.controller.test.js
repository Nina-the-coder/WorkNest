const CustomerController = require("../../src/modules/customer/customer.controller");
const CustomerService = require("../../src/modules/customer/customer.service");

jest.mock("../../src/modules/customer/customer.service");

describe("Customer Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getAllCustomers should return customers", async () => {
    const req = {};

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const customers = [{ name: "Test Customer" }];

    CustomerService.getAllCustomers.mockResolvedValue(customers);

    await CustomerController.getAllCustomers(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(customers);
  });

  test("deleteCustomer should delete customer", async () => {
    const req = {
      params: { customerId: "CUST001" },
      user: { _id: "user123" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    CustomerService.deleteCustomer.mockResolvedValue();

    await CustomerController.deleteCustomer(req, res);

    expect(CustomerService.deleteCustomer).toHaveBeenCalledWith(
      "CUST001",
      "user123",
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("updateCustomer should update customer", async () => {
    const req = {
      params: { customerId: "CUST001" },
      body: { name: "New Name" },
      user: { _id: "user123" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const updatedCustomer = { name: "New Name" };

    CustomerService.updateCustomer.mockResolvedValue(updatedCustomer);

    await CustomerController.updateCustomer(req, res);

    expect(CustomerService.updateCustomer).toHaveBeenCalledWith(
      "CUST001",
      req.body,
      "user123",
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
