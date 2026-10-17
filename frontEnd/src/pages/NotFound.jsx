import { Link } from "react-router-dom";
import { useAuth } from "../modules/auth/useAuth";

const NotFound = () => {
  const { user } = useAuth();
  const home = user?.role === "admin"
    ? "/admin/dashboard"
    : user?.role === "employee" ? "/employee/dashboard" : "/";

  return (
    <div className="p-8 text-text">
      <h1 className="text-xl font-semibold">Page unavailable</h1>
      <p className="mt-2 text-secondary-text">This page is not available. Choose a section from the navigation.</p>
      <Link to={home} className="mt-4 inline-block text-cta hover:underline">
        {user ? "Back to dashboard" : "Go to login"}
      </Link>
    </div>
  );
};

export default NotFound;
