import { useAuth } from "../../modules/auth/useAuth";
import ThemeToggle from "./buttons/ThemeToggle";

const Header = ({ title }) => {
  const { user } = useAuth();
  const role = user?.role === "admin" ? "Admin" : user?.role === "employee" ? "Employee" : "";
  return (
    <div className="w-full h-[48px] flex items-center text-text">
      <div className="flex w-full justify-between">
        <div className="text-[24px] font-bold ml-6">{title}</div>
        <div className="text-[24px] font-bold mr-4">{role}</div>
      </div>
      <ThemeToggle />
    </div>
  );
};

export default Header;
