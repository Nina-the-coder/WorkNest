// layouts/EmployeeLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../shared/components/Sidebar";

const EmployeeLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="employee" />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default EmployeeLayout;