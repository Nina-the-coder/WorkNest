// layouts/EmployeeLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../shared/components/Sidebar";

const EmployeeLayout = () => {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="min-w-0 flex-1 p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default EmployeeLayout;
