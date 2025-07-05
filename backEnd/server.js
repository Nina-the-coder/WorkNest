const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const employeeRoutes = require("./routes/employeeRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employee", employeeRoutes);

mongoose
  .connect(process.env.MONGO_URI, {})
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log("MongoDB connection error...", err));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
