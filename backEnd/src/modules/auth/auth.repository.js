const User = require("../../models/user.model");

const findUserByEmail = async (email, { includePassword = false } = {}) => {
  const query = User.findOne({ email });
  if (includePassword) query.select("+password");
  return await query;
};

const createUser = async (userData) => {
  const user = new User(userData);
  return await user.save();
};

const findActiveUserProfileById = async (userId) =>
  User.findOne({ _id: userId, status: "active", deleted: false })
    .select("_id name email role empId phone status createdAt")
    .lean();

module.exports = {
  findUserByEmail,
  createUser,
  findActiveUserProfileById,
};
