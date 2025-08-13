const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["admin", "employee"],
    default: "employee",
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  phone: {
    type: String,
    maxLength: 10,
  },
  // designation: {
  //     type: String
  // },
  empId: {
    type: String,
    unique: true,
    sparse: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  deleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
});

// password hash
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model("User", userSchema);
