import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import Header from "../../shared/components/Header";
import { getNavigationItems } from "../../shared/navigation";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const workAreas = getNavigationItems(user).filter(
    (item) => item.path !== "/employee/dashboard",
  );

  return (
    <div className="flex flex-col gap-5 pb-8">
      <Header title="Dashboard" />
      <div className="rounded-2xl border border-border-color bg-card-bg p-6">
        <h1 className="text-xl font-semibold text-text">
          {user?.name ? `Welcome, ${user.name}` : "Welcome to WorkNest"}
        </h1>
        <p className="mt-2 text-sm text-secondary-text">
          Open your assigned tasks, quotations or account details below.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {workAreas.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="rounded-xl border border-border-color p-5 text-text hover:border-cta focus:outline-cta"
            >
              <h2 className="font-semibold">{item.name}</h2>
              <p className="mt-2 text-sm text-secondary-text">
                {item.path === "/employee/tasks"
                  ? "View your assigned tasks and update their status."
                  : item.path === "/employee/quotations"
                  ? "View your quotations and their current status."
                  : "View your personal and account information."}
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-6 text-sm text-secondary-text">
          Customers and Products will be available here in a later update.
        </p>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
