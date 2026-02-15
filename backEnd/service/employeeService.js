const User = require("../models/User");
const getNextSequence = require("../utils/getNextSequence");
const AppError = require("../utils/AppError");

exports.addEmployee = async (data, userId) => {
  const { name, email, phone, password, role, status } = data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.deleted) {
      existingUser.deleted = false;
      existingUser.deletedAt = null;
      existingUser.name = name; // update other details if needed
      existingUser.phone = phone;
      existingUser.password = password; // will be hashed by pre('save')
      existingUser.role = role;
      existingUser.status = status;
      existingUser.updatedBy = userId; //  who restored
      await existingUser.save();
      return existingUser;
    }
    throw new AppError("Employee already exists", 400);
  }
  const nextEmpNumber = await getNextSequence("empId");
  const newEmpId = `EMP${String(nextEmpNumber).padStart(3, "0")}`;

  const newUser = new User({
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

  await newUser.save();
  return newUser;
};

