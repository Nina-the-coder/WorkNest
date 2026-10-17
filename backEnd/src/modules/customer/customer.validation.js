const { body, validationResult } = require("express-validator");
const AppError = require("../../utils/AppError");

const fields = ["name", "address", "contact", "gst", "email", "status", "companyType"];

exports.validateCreateCustomer = async (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError("Customer data is required", 400);
  }
  const data = {};
  for (const field of fields) {
    if (input[field] !== undefined && typeof input[field] !== "string") {
      throw new AppError(`${field} must be text`, 400);
    }
    data[field] = input[field]?.trim() ?? "";
  }
  if (!data.name) throw new AppError("Customer name is required", 400);
  data.status = input.status === undefined ? "active" : data.status;
  if (!["active", "inactive"].includes(data.status)) throw new AppError("Invalid customer status", 400);
  data.companyType = input.companyType === undefined ? "dealer" : data.companyType;
  if (data.email) {
    const validationRequest = { body: { email: data.email } };
    await body("email").isEmail().withMessage("Valid email is required").run(validationRequest);
    if (!validationResult(validationRequest).isEmpty()) throw new AppError("Valid email is required", 400);
  }
  return data;
};

exports.validateCreateRequestKey = (key) => {
  if (key === undefined) return undefined;
  if (typeof key !== "string" || key.length > 128 || !/^[A-Za-z0-9_.:-]+$/.test(key)) {
    throw new AppError("Invalid Idempotency-Key", 400);
  }
  return key;
};
