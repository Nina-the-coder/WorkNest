const mongoose = require('mongoose');

function auditPlugin(schema, options) {
  schema.add({
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // assuming you have a User model
      required: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  });

  // optional: auto-set updatedBy on save
  schema.pre("save", function (next) {
    if (this.isModified()) {
      this.updatedAt = Date.now();
    }
    next();
  });
}

module.exports = auditPlugin;
