// layouts/AdminLayout.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "../shared/components/Sidebar";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 p-4">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;