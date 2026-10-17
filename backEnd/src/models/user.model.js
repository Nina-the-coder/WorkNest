const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const auditPlugin = require("../utils/auditPlugin");

const removePassword = (_document, user) => {
  delete user.password;
  return user;
};

const userSchema = new mongoose.Schema(
  {
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
      minlength: [6, "Password must be at least 6 characters"],
      cast: "Password must be text",
      select: false,
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
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { transform: removePassword },
    toObject: { transform: removePassword },
  }
);

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

userSchema.plugin(auditPlugin);

module.exports = mongoose.model("User", userSchema);
