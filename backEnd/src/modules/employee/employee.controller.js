const EmployeeService = require("./employee.service");

exports.addEmployee = async (req, res) => {
  const user = await EmployeeService.addEmployee(req.body, req.user._id);
  res.status(201).json(user);
};

exports.getEmployeeById = async (req, res) => {
  const employee = await EmployeeService.getEmployeeById(req.params.empId);
  res.status(200).json(employee);
};

exports.getAllEmployees = async (req, res) => {
  const employees = await EmployeeService.getAllEmployees();
  res.status(200).json(employees);
};

exports.deleteEmployee = async (req, res) => {
  await EmployeeService.deleteEmployee(req.params.empId, req.user._id);
  res.status(200).json({ message: "Employee deleted successfully" });
};

exports.updateEmployee = async (req, res) => {
  await EmployeeService.updateEmployee(req.params.empId, req.body, req.user._id);
  res.status(200).json({ message: "Employee updated successfully" });
};
