const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../../utils/AppError");
const { getPermissionsForRole } = require("../../utils/rolePermissions");
const authRepository = require("./auth.repository");

const registerUser = async (userData) => {
  const { email } = userData;

  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError("User already exists...", 400);
  }

  // The User pre-save hook owns hashing for registration and employee updates.
  await authRepository.createUser(userData);

  return { message: "User got registered successfully..." };
};

const loginUser = async (email, password) => {
  const user = await authRepository.findUserByEmail(email, {
    includePassword: true,
  });
  if (!user) {
    throw new AppError("Invalid email or password.", 400);
  }

  if (user.status !== "active" || user.deleted) {
    throw new AppError("Account is inactive or deleted", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("Invalid email or password.", 400);
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  // Get permissions for user's role
  const permissions = getPermissionsForRole(user.role);

  return {
    message: "Login successful...",
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions, // Include permissions in response
    },
  };
};

const getCurrentUser = async (actor) => {
  if (!actor?._id) throw new AppError("Authentication required", 401);

  const user = await authRepository.findActiveUserProfileById(actor._id);
  if (!user) throw new AppError("Account is inactive or deleted", 401);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: getPermissionsForRole(user.role),
      empId: user.empId,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
    },
  };
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
