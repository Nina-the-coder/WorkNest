const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const authService = require("../../src/modules/auth/auth.service");
const authRepository = require("../../src/modules/auth/auth.repository");
const AppError = require("../../src/utils/AppError");

jest.mock("../../src/modules/auth/auth.repository");
jest.mock("bcrypt");
jest.mock("jsonwebtoken");

describe("Auth Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUser", () => {
    test("should register a new user successfully", async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashedPassword");
      const userData = {
        email: "test@test.com",
        password: "123456",
      };
      const result = await authService.registerUser(userData);
      expect(authRepository.findUserByEmail).toHaveBeenCalledWith(
        "test@test.com",
      );
      expect(authRepository.createUser).toHaveBeenCalledWith({
        ...userData,
        password: "hashedPassword",
      });
      expect(result.message).toBe("User got registered successfully...");
    });

    test("should throw error if user already exists", async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        email: "test@test.com",
      });

      await expect(
        authService.registerUser({
          email: "test@test.com",
          password: "123456",
        }),
      ).rejects.toThrow(AppError);
    });
  });

  describe("loginUser", () => {
    test("should login user successfully", async () => {
      const fakeUser = {
        _id: "123",
        email: "test@test.com",
        password: "hashedPassword",
        role: "admin",
      };

      authRepository.findUserByEmail.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("fakeToken");

      const result = await authService.loginUser("test@test.com", "123456");

      expect(bcrypt.compare).toHaveBeenCalledWith("123456", "hashedPassword");

      expect(jwt.sign).toHaveBeenCalled();

      expect(result.token).toBe("fakeToken");
    });

    test("should throw error if user does not exist", async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await expect(
        authService.loginUser("wrong@test.com", "123456"),
      ).rejects.toThrow(AppError);
    });

    test("should throw error if password is incorrect", async () => {
      const fakeUser = {
        _id: "123",
        email: "test@test.com",
        password: "hashedPassword",
      };

      authRepository.findUserByEmail.mockResolvedValue(fakeUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.loginUser("test@test.com", "wrongpassword"),
      ).rejects.toThrow(AppError);
    });
  });
});
