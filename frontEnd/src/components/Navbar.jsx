import React, { useEffect, useState } from "react";
import workNestLogo from "../assets/WorkNestLogo.jpg";

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  return (
    <div className="h-15 flex justify-between">
      <img className="h-full" src={workNestLogo} alt="WorkNest" />
      {user && <div className="text-3xl flex justify-center items-center mr-30">
        Welcome Back, {user.name}
      </div>}
    </div>
  );
};

export default Navbar;
