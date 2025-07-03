import React from "react";
import { Link, useLocation } from "react-router-dom";
import WorkNestLogo from "../assets/WorkNestLogo.jpg";

const Sidebar = () => {
  const location = useLocation();
  const items = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Employees", path: "/admin/employees" },
    { name: "Tasks", path: "/admin/tasks" },
    { name: "Quotations", path: "/admin/quotation" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Conversations", path: "/admin/conversations" },
    { name: "Profile", path: "/admin/profile" },
  ];

  return (
    <div className="w-64 bg-white border-r min-h-screen fixed">
      {/* logo */}
      <div className="p-2 pr-10">
        <img src={WorkNestLogo} />
      </div>

      {/* elements */}
      <nav className="flex flex-col gap-3 mt-6">
        {items.map((item, index) => (
          <Link key={index} to={item.path} className={`text-xl pl-5 mx-2 py-1 rounded-2xl ${item.path === location.pathname && 'bg-green-300'}`}>
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
