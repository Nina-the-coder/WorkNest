const adminItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: "layout-dashboard", permission: "DASHBOARD_READ" },
  { name: "Employees", path: "/admin/employees", icon: "circle-user-round", permission: "EMPLOYEE_READ" },
  { name: "Tasks", path: "/admin/tasks", icon: "list-checks", permission: "TASK_READ" },
  { name: "Products", path: "/admin/products", icon: "shopping-cart", permission: "PRODUCT_READ" },
  { name: "Customers", path: "/admin/customers", icon: "notepad-text", permission: "CUSTOMER_READ" },
  { name: "Quotations", path: "/admin/quotations", icon: "users", permission: "QUOTATION_READ", relatedPaths: ["/admin/add-quotation"] },
  { name: "Orders", path: "/admin/orders", icon: "scroll", permission: "ORDER_READ" },
  { name: "Profile", path: "/admin/profile", icon: "user" },
];

const employeeItems = [
  { name: "Dashboard", path: "/employee/dashboard", icon: "layout-dashboard", permission: "DASHBOARD_READ" },
  { name: "My Tasks", path: "/employee/tasks", icon: "list-checks", permission: "TASK_READ" },
  { name: "Customers", path: "/employee/customers", icon: "notepad-text", permission: "CUSTOMER_READ" },
  { name: "Product Catalog", path: "/employee/products", icon: "shopping-cart", permission: "PRODUCT_READ" },
  { name: "My Quotations", path: "/employee/quotations", icon: "users", permission: "QUOTATION_READ", relatedPaths: ["/employee/quotation"] },
  { name: "My Profile", path: "/employee/profile", icon: "user" },
];

export const getNavigationItems = (user) => {
  const items = user?.role === "admin"
    ? adminItems
    : user?.role === "employee" ? employeeItems : [];
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

  return items.filter((item) => !item.permission || permissions.includes(item.permission));
};

export const isNavigationItemActive = (item, pathname) =>
  [item.path, ...(item.relatedPaths || [])].some((path) =>
    pathname.toLowerCase() === path.toLowerCase() ||
    pathname.toLowerCase().startsWith(`${path.toLowerCase()}/`),
  );
