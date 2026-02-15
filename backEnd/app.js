const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const publicRoutes = require("./routes/publicRoutes");
const { verifyToken } = require("./middleware/verifyToken");
const isEmployee = require("./middleware/isEmployee");
const isAdmin = require("./middleware/isAdmin");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", verifyToken, isAdmin, adminRoutes);
app.use("/api/employee", verifyToken, isEmployee, employeeRoutes);
app.use("/api", publicRoutes);


app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;