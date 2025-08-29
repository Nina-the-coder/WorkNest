import React, { useEffect, useState } from "react";
import  WorkNestDark from "../assets/WorkNest-dark.svg";
import  WorkNestLight from "../assets/WorkNest-light.svg";

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  return (
    <div className="h-15 flex justify-between bg-slate-300 sticky top-0">
      <img
        src={WorkNestLight}
        alt="WorkNest"
        className="block dark:hidden h-20"
      />

      {/* Dark mode logo */}
      <img
        src={WorkNestDark}
        alt="WorkNest"
        className="hidden dark:block h-20"
      />
      {user && (
        <div className="text-3xl flex justify-center items-center mr-30">
          Welcome Back, {user.name}
        </div>
      )}
    </div>
  );
};

export default Navbar;
