const User = require("../../models/user.model");

exports.findByEmail = (email) => {
  return User.findOne({ email });
};

exports.findByEmpId = (empId) => {
  return User.findOne({ empId });
};

exports.findActiveByEmpId = (empId) => {
  return User.findOne({ empId, deleted: false });
};

exports.findAllActive = () => {
  return User.find({ deleted: false }).select("-password");
};

exports.createUser = (data) => {
  return User.create(data);
};

exports.saveUser = (user) => {
  return user.save();
};