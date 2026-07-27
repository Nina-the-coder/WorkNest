const employeeRepo = require("./employee.repository");
const getNextSequence = require("../../utils/getNextSequence");
const AppError = require("../../utils/AppError");

exports.addEmployee = async (data, userId) => {
  const { name, email, phone, password, role, status } = data;

  const existingUser = await employeeRepo.findByEmail(email);

  if (existingUser) {
    if (existingUser.deleted) {
      existingUser.deleted = false;
      existingUser.deletedAt = null;
      existingUser.name = name;
      existingUser.phone = phone;
      existingUser.password = password;
      existingUser.role = role;
      existingUser.status = status;
      existingUser.updatedBy = userId;

      return employeeRepo.saveUser(existingUser);
    }
    throw new AppError("Employee already exists", 400);
  }

  const nextEmpNumber = await getNextSequence("empId");
  const newEmpId = `EMP${String(nextEmpNumber).padStart(3, "0")}`;

  return employeeRepo.createUser({
    name,
    email,
    phone,
    password,
    role,
    status,
    empId: newEmpId,
    createdBy: userId,
    updatedBy: userId,
  });
};

exports.getEmployeeById = async (empId) => {
  const employee = await employeeRepo.findActiveByEmpId(empId);

  if (!employee) {
    throw new AppError("Employee not found", 404);
  }

  employee.password = undefined;
  return employee;
};

exports.getAllEmployees = async () => {
  return employeeRepo.findAllActive();
};

exports.deleteEmployee = async (empId, userId) => {
  const emp = await employeeRepo.findActiveByEmpId(empId);

  if (!emp) {
    throw new AppError("Employee not found", 404);
  }

  emp.deleted = true;
  emp.deletedAt = new Date();
  emp.updatedBy = userId;

  await employeeRepo.saveUser(emp);
};

exports.updateEmployee = async (empId, data, userId) => {
  const { name, email, phone, password, role, status } = data;

  const user = await employeeRepo.findActiveByEmpId(empId);
  if (!user) {
    throw new AppError("Employee not found", 404);
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;

  if (email && email !== user.email) {
    const existingUser = await employeeRepo.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email already in use", 400);
    }
    user.email = email;
  }

  if (password) user.password = password;
  if (role) user.role = role;
  if (status) user.status = status;

  user.updatedBy = userId;

  return employeeRepo.saveUser(user);
};