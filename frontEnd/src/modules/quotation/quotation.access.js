// These checks control visible actions. The API independently enforces access.
const referenceId = (reference) => reference?._id || reference;

export const canAccessQuotation = (user, quotation) => Boolean(
  user && quotation && (
    user.role === "admin" ||
    String(referenceId(quotation.employeeId)) === String(user._id)
  ),
);

export const quotationActions = (user, quotation) => {
  const permitted = (permission) => canAccessQuotation(user, quotation) &&
    Array.isArray(user.permissions) && user.permissions.includes(permission);
  const status = quotation?.status;
  return {
    edit: ["DRAFT", "REJECTED"].includes(status) && permitted("QUOTATION_UPDATE"),
    submit: status === "DRAFT" && permitted("QUOTATION_SUBMIT"),
    approve: status === "SUBMITTED" && permitted("QUOTATION_APPROVE"),
    reject: status === "SUBMITTED" && permitted("QUOTATION_REJECT"),
    reopen: status === "REJECTED" && permitted("QUOTATION_UPDATE"),
    archive: status === "DRAFT" && permitted("QUOTATION_ARCHIVE"),
    convert: user?.role === "admin" && status === "APPROVED" && permitted("ORDER_CREATE"),
  };
};
