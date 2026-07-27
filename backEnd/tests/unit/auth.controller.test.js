const AuthController = require("../../src/modules/auth/auth.controller");
const AuthService = require("../../src/modules/auth/auth.service");

jest.mock("../../src/modules/auth/auth.service");

describe("Auth Controller", () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("registerUser should return 201", async () => {

    const req = {
      body: {
        email: "test@test.com",
        password: "123456"
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    AuthService.registerUser.mockResolvedValue({
      message: "User got registered successfully..."
    });

    await AuthController.registerUser(req, res);

    expect(AuthService.registerUser).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);

  });

  test("loginUser should return token", async () => {

    const req = {
      body: {
        email: "test@test.com",
        password: "123456"
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    AuthService.loginUser.mockResolvedValue({
      token: "fakeToken"
    });

    await AuthController.loginUser(req, res);

    expect(AuthService.loginUser).toHaveBeenCalledWith(
      "test@test.com",
      "123456"
    );

    expect(res.status).toHaveBeenCalledWith(200);

  });

});