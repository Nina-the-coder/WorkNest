const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../../utils/AppError");
const { getPermissionsForRole } = require("../../utils/rolePermissions");
const authRepository = require("./auth.repository");

const registerUser = async (userData) => {
  const { email, password } = userData;

  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw new AppError("User already exists...", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await authRepository.createUser({
    ...userData,
    password: hashedPassword,
  });

  return { message: "User got registered successfully..." };
};

const loginUser = async (email, password) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    throw new AppError("Invalid email or password.", 400);
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

module.exports = {
  registerUser,
  loginUser,
};
