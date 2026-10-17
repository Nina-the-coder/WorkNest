const AuthService = require("./auth.service");

// function for register user (only for admin)
exports.registerUser = async (req, res) => {
    const result = await AuthService.registerUser(req.body);
    res.status(201).json(result);
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(email, password);
    res.status(200).json(result);
};

exports.getCurrentUser = async (req, res) => {
    const result = await AuthService.getCurrentUser(req.user);
    res.status(200).json(result);
};
