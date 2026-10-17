const AppError = require("./AppError");

// Operation permissions are enforced by middleware; this narrows record access.
const getResourceScope = (user, ownerField) => {
  if (!user?._id) throw new AppError("Authentication required", 401);
  return user.role === "admin" ? {} : { [ownerField]: user._id };
};

module.exports = { getResourceScope };
