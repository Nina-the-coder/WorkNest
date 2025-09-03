import React from "react";
import { Link, useLocation } from "react-router-dom";
import WorkNestDark from "../assets/WorkNest-dark.svg";
import WorkNestLight from "../assets/WorkNest-light.svg";
import Icon from "./Icons";

const Sidebar = () => {
  const location = useLocation();

  const items = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "layout-dashboard" },
    { name: "Employees", path: "/admin/employees", icon: "circle-user-round" },
    { name: "Tasks", path: "/admin/tasks", icon: "list-checks" },
    { name: "Products", path: "/admin/Products", icon: "shopping-cart" },
    { name: "Customers", path: "/admin/customers", icon: "notepad-text" },
    { name: "Quotations", path: "/admin/quotations", icon: "users" },
    { name: "Orders", path: "/admin/orders", icon: "scroll" },
    {
      name: "Conversations",
      path: "/admin/conversations",
      icon: "message-circle-more",
    },
    { name: "Profile", path: "/admin/profile", icon: "user" },
  ];

  return (
    <div className="w-64 min-h-screen fixed bg-card-bg text-text">
      {/* logo */}
      <div className="w-64 my-4 ml-4">
        <img src={WorkNestLight} alt="WorkNest" className="block dark:hidden" />
        <img src={WorkNestDark} alt="WorkNest" className="hidden dark:block" />
      </div>

      {/* navigation */}
      <nav className="flex flex-col">
        {items.map((item, index) => {
          const isActive = item.path === location.pathname;
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center pl-5 py-3 pr-4 rounded-l-xl border border-transparent mb-2 transition-all duration-300 
                ${isActive 
                  ? "bg-bg ml-4" 
                  : "hover:border-text text-text"
                }`}
            >
              <Icon
                name={item.icon}
                className={`mr-4 text-lg ${isActive ? "text-purple-400" : "text-text"}`}
              />
              <span className="text-[15px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
