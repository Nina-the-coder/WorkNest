import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import WorkNestLogo from "../assets/WorkNestLogo.jpg";
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
      <div className="p-2 pr-10 flex">
        <img src={WorkNestLogo} />
      </div>
      {/* elements */}
      <nav className="flex flex-col gap-4 mt-6 p-4">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-center mx-2 rounded-2xl border border-card-bg hover:border-text text ${
            item.path === location.pathname && "bg-green text-black"
            }`}
          >
            <Link
              to={item.path}
              className={`text-xl  flex pl-5 py-1 pr-4 rounded-2xl w-full h-full`}
            >
              <Icon name={item.icon} className="text-secondary mr-4" />
              <span className="text-[16px]">{item.name}</span>
            </Link>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
