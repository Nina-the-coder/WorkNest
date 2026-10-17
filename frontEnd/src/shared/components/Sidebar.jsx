import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/useAuth";
import { getNavigationItems, isNavigationItemActive } from "../navigation";
import Icon from "./Icons";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const items = getNavigationItems(user);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div
      className={`h-screen sticky top-0 pt-4 ${
        collapsed ? " " : "pl-2"
      } bg-card-bg text-text transition-all ease-in-out duration-300 z-50 flex flex-col`}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        aria-expanded={!collapsed}
        className="cursor-pointer mb-16 mt-4"
      >
        <Icon name="menu" className="w-20" />
      </button>

      <nav aria-label="Main navigation" className="flex flex-col">
        {items.map((item) => {
          const isActive = isNavigationItemActive(item, location.pathname);
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.name : undefined}
              className={`flex items-center pl-5 py-3 border border-transparent mb-2 ${
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

      <button
        type="button"
        onClick={handleLogout}
        aria-label="Log out"
        title={collapsed ? "Log out" : undefined}
        className="mt-auto mb-6 flex items-center pl-5 py-3 border border-transparent hover:border-text cursor-pointer"
      >
        <Icon name="log-out" className="mr-4" />
        {!collapsed && <span className="text-[15px] font-medium">Log out</span>}
      </button>
    </div>
  );
};

export default Sidebar;
