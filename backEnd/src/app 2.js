const express = require("express");
const cors = require("cors");
const path = require("path");
const requestLogger = (req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
};

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use("/uploads", express.static(path.join(__dirname, "/../uploads")));

app.use("/api/auth", require("./modules/auth/auth.routes"));
app.use("/api/customers", require("./modules/customer/customer.routes"));
app.use("/api/employees", require("./modules/employee/employee.routes"));
app.use("/api/tasks", require("./modules/task/task.routes"));
app.use("/api/products", require("./modules/product/product.routes"));
app.use("/api/quotations", require("./modules/quotation/quotation.routes"));
app.use("/api/orders", require("./modules/order/order.routes"));
app.use("/api/dashboard", require("./modules/dashboard/dashboard.routes"));
// app.use("/api/admin", verifyToken, isAdmin, adminRoutes);
// app.use("/api", verifyToken, publicRoutes);

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;


