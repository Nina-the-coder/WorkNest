import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import WorkNestLogo from "../assets/WorkNestLogo.jpg";

const Sidebar = () => {
  const location = useLocation();
  const items = [
    { name: "Dashboard", path: "/admin/dashboard" },
    { name: "Employees", path: "/admin/employees" },
    { name: "Tasks", path: "/admin/tasks" },
    { name: "Products", path: "/admin/Products" },
    { name: "Customers", path: "/admin/customers" },
    { name: "Quotations", path: "/admin/quotations" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Conversations", path: "/admin/conversations" },
    { name: "Profile", path: "/admin/profile" },
  ];
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="w-64 border-r min-h-screen fixed bg-slate-300">
      {/* logo */}
      <div className="p-2 pr-10 flex">
        <button className="px-2 hover:bg-slate-400 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
          ☰
        </button>
        <img src={WorkNestLogo} />
      </div>

      {/* elements */}
      <nav className="flex flex-col gap-3 mt-6">
        {items.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`text-xl pl-5 mx-2 py-1 rounded-2xl ${
              item.path === location.pathname && "bg-emerald-500"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
