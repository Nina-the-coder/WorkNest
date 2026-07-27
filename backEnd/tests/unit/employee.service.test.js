const EmployeeService = require("../../src/modules/employee/employee.service");
const employeeRepo = require("../../src/modules/employee/employee.repository");
const getNextSequence = require("../../src/utils/getNextSequence");
const AppError = require("../../src/utils/AppError");

jest.mock("../../src/modules/employee/employee.repository");
jest.mock("../../src/utils/getNextSequence");

describe("Employee Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("addEmployee", () => {
    test("should create new employee", async () => {
      employeeRepo.findByEmail.mockResolvedValue(null);
      getNextSequence.mockResolvedValue(1);

      const data = {
        name: "John",
        email: "john@test.com",
        phone: "9999999999",
        password: "123456",
        role: "employee",
        status: "active",
      };

      employeeRepo.createUser.mockResolvedValue({
        ...data,
        empId: "EMP001",
      });

      const result = await EmployeeService.addEmployee(data, "admin123");

      expect(employeeRepo.createUser).toHaveBeenCalled();
      expect(result.empId).toBe("EMP001");
    });

    test("should restore deleted employee", async () => {
      const existingUser = {
        email: "john@test.com",
        deleted: true,
      };

      employeeRepo.findByEmail.mockResolvedValue(existingUser);
      employeeRepo.saveUser.mockResolvedValue(existingUser);

      const result = await EmployeeService.addEmployee(
        {
          name: "John",
          email: "john@test.com",
        },
        "admin123",
      );

      expect(employeeRepo.saveUser).toHaveBeenCalled();
      expect(result).toEqual(existingUser);
    });

    test("should throw error if employee already exists", async () => {
      employeeRepo.findByEmail.mockResolvedValue({
        email: "john@test.com",
        deleted: false,
      });

      await expect(
        EmployeeService.addEmployee(
          {
            email: "john@test.com",
          },
          "admin123",
        ),
      ).rejects.toThrow(AppError);
    });
  });

  describe("getEmployeeById", () => {
    test("should return employee without password", async () => {
      const mockUser = {
        empId: "EMP001",
        password: "hashedPassword",
      };

      employeeRepo.findActiveByEmpId.mockResolvedValue(mockUser);

      const result = await EmployeeService.getEmployeeById("EMP001");

      expect(result.password).toBeUndefined();
    });

    test("should throw error if employee not found", async () => {
      employeeRepo.findActiveByEmpId.mockResolvedValue(null);

      await expect(EmployeeService.getEmployeeById("EMP001")).rejects.toThrow(
        AppError,
      );
    });
  });

  describe("getAllEmployees", () => {
    test("should return all employees", async () => {
      const employees = [{ name: "John" }];

      employeeRepo.findAllActive.mockResolvedValue(employees);

      const result = await EmployeeService.getAllEmployees();

      expect(result).toEqual(employees);
    });
  });

  describe("deleteEmployee", () => {
    test("should delete employee", async () => {
      const mockUser = {};

      employeeRepo.findActiveByEmpId.mockResolvedValue(mockUser);

      await EmployeeService.deleteEmployee("EMP001", "admin123");

      expect(employeeRepo.saveUser).toHaveBeenCalled();
    });

    test("should throw error if employee not found", async () => {
      employeeRepo.findActiveByEmpId.mockResolvedValue(null);

      await expect(
        EmployeeService.deleteEmployee("EMP001", "admin123"),
      ).rejects.toThrow(AppError);
    });
  });

  describe("updateEmployee", () => {
    test("should update employee successfully", async () => {
      const mockUser = {
        email: "old@test.com",
      };

      employeeRepo.findActiveByEmpId.mockResolvedValue(mockUser);
      employeeRepo.saveUser.mockResolvedValue(mockUser);

      const result = await EmployeeService.updateEmployee(
        "EMP001",
        { name: "New Name" },
        "admin123",
      );

      expect(mockUser.name).toBe("New Name");
      expect(result).toEqual(mockUser);
    });

    test("should throw error if employee not found", async () => {
      employeeRepo.findActiveByEmpId.mockResolvedValue(null);

      await expect(
        EmployeeService.updateEmployee("EMP001", {}, "admin123"),
      ).rejects.toThrow(AppError);
    });

    test("should throw error if email already exists", async () => {
      const mockUser = {
        email: "old@test.com",
      };

      employeeRepo.findActiveByEmpId.mockResolvedValue(mockUser);

      employeeRepo.findByEmail.mockResolvedValue({
        email: "new@test.com",
      });

      await expect(
        EmployeeService.updateEmployee(
          "EMP001",
          { email: "new@test.com" },
          "admin123",
        ),
      ).rejects.toThrow(AppError);
    });
  });
});
