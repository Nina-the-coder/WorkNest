const EmployeeController = require("../../src/modules/employee/employee.controller");
const EmployeeService = require("../../src/modules/employee/employee.service");

jest.mock("../../src/modules/employee/employee.service");

describe("Employee Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("addEmployee should return 201", async () => {
    const req = {
      body: { name: "John" },
      user: { _id: "admin123" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    EmployeeService.addEmployee.mockResolvedValue({ name: "John" });

    await EmployeeController.addEmployee(req, res);

    expect(EmployeeService.addEmployee).toHaveBeenCalledWith(
      req.body,
      "admin123",
    );

    expect(res.status).toHaveBeenCalledWith(201);
  });

  test("getEmployeeById should return employee", async () => {
    const req = { params: { empId: "EMP001" } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const employee = { name: "John" };

    EmployeeService.getEmployeeById.mockResolvedValue(employee);

    await EmployeeController.getEmployeeById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(employee);
  });

  test("getAllEmployees should return employees", async () => {
    const req = {};

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const employees = [{ name: "John" }];

    EmployeeService.getAllEmployees.mockResolvedValue(employees);

    await EmployeeController.getAllEmployees(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(employees);
  });

  test("deleteEmployee should delete employee", async () => {
    const req = {
      params: { empId: "EMP001" },
      user: { _id: "admin123" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    EmployeeService.deleteEmployee.mockResolvedValue();

    await EmployeeController.deleteEmployee(req, res);

    expect(EmployeeService.deleteEmployee).toHaveBeenCalledWith(
      "EMP001",
      "admin123",
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("updateEmployee should update employee", async () => {
    const req = {
      params: { empId: "EMP001" },
      body: { name: "Updated Name" },
      user: { _id: "admin123" },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    EmployeeService.updateEmployee.mockResolvedValue();

    await EmployeeController.updateEmployee(req, res);

    expect(EmployeeService.updateEmployee).toHaveBeenCalledWith(
      "EMP001",
      req.body,
      "admin123",
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
