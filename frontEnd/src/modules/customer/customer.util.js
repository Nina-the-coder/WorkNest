const CUSTOMER_FIELDS = ["name", "address", "contact", "gst", "email", "status", "companyType"];

export const customerFormData = (customer = {}) => Object.fromEntries(
  CUSTOMER_FIELDS.map((field) => [field, typeof customer[field] === "string"
    ? customer[field]
    : field === "status" ? "active" : field === "companyType" ? "dealer" : ""]),
);

// Only contact/classification fields are sent. The server records the actual creator.
export const customerPayload = (form) => Object.fromEntries(
  CUSTOMER_FIELDS.map((field) => [field, form[field].trim()]),
);

export const validateCustomerForm = (form) => {
  if (!form.name.trim()) return "Customer name is required.";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Enter a valid email address.";
  }
  return null;
};

export const createCustomerRequestKey = () => {
  if (globalThis.crypto.randomUUID) return globalThis.crypto.randomUUID();
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)),
    (value) => value.toString(16).padStart(2, "0")).join("");
};

export const formatCustomerDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};
