import React, { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import WorkNestDark from "../../assets/WorkNest-dark.svg";
import WorkNestLight from "../../assets/WorkNest-light.svg";
import Icon from "./Icons";
import VariantButton from "./buttons/VariantButton";
import { hasPermission } from "../../utils/permissions";

const Sidebar = ({ role }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Define all navigation items with their required permissions
  const allItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: "layout-dashboard",
      permission: "DASHBOARD_READ",
    },
    {
      name: "Employees",
      path: "/admin/employees",
      icon: "circle-user-round",
      permission: "EMPLOYEE_READ",
    },
    {
      name: "Tasks",
      path: "/admin/tasks",
      icon: "list-checks",
      permission: "TASK_READ",
    },
    {
      name: "Products",
      path: "/admin/Products",
      icon: "shopping-cart",
      permission: "PRODUCT_READ",
    },
    {
      name: "Customers",
      path: "/admin/customers",
      icon: "notepad-text",
      permission: "CUSTOMER_READ",
    },
    {
      name: "Quotations",
      path: "/admin/quotations",
      icon: "users",
      permission: "QUOTATION_READ",
    },
    {
      name: "Orders",
      path: "/admin/orders",
      icon: "scroll",
      permission: "ORDER_READ",
    },
    {
      name: "Profile",
      path: "/admin/profile",
      icon: "user",
      permission: "DASHBOARD_READ", // Profile accessible to all authenticated users
    },
  ];

  // Filter items based on user permissions
  const items = useMemo(() => {
    return allItems.filter((item) => hasPermission(item.permission));
  }, []);

  return (
    <div
      className={`h-screen sticky top-0 pt-4 ${
        collapsed ? " " : "pl-2"
      } bg-card-bg text-text transition-all ease-in-out duration-300 z-50 `}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="cursor-pointer mb-16 mt-4"
      >
        <Icon name="menu" className="w-20" />
      </button>

      {/* logo */}
      {/* <div className="my-4 ml-4">
        <img src={WorkNestLight} alt="WorkNest" className="block dark:hidden" />
        <img src={WorkNestDark} alt="WorkNest" className="hidden dark:block" />
      </div> */}

      {/* navigation - filtered by permissions */}
      <nav className="flex flex-col">
        {items.map((item, index) => {
          const isActive = item.path === location.pathname;
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center pl-5 py-3 border border-transparent mb-2  
                ${
                  isActive
                    ? "bg-bg ml-4 rounded-l-2xl"
                    : "hover:border-text text-text"
                }`}
            >
              <Icon
                name={item.icon}
                className={`mr-4 text-lg ${
                  isActive ? "text-purple-400" : "text-text"
                }`}
              />
              {!collapsed && (
                <span className="text-[15px] font-medium w-[150px]">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
