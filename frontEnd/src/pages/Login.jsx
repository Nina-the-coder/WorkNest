import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Worknestlogo from "../assets/WorknestLogo.jpg";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "employee",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );
      console.log(res.data); // 👀 Check this in the browser console

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/employee/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="navbar h-15 p-1.5 w-full ">
        <img className="h-full" src={Worknestlogo} />
      </div>

      <div className="main flex flex-col justify-center items-center mt-8">
        <div className="login h-fit w-100 p-8 mt-8 border-2 rounded-lg">
          <div className="text-3xl mt-4 mb-8 text-center">Login</div>
          <form onSubmit={handleLogin}>
            <label htmlFor="email" className="w-full">
              Email
            </label>
            <input
              id="email"
              name="email"
              className="w-full border mb-4 p-0.5"
              type="text"
              value={formData.email}
              onChange={handleChange}
            ></input>

            <label htmlFor="password" className="w-full">
              Password
            </label>
            <input
              id="password"
              name="password"
              className="w-full border mb-4 p-0.5"
              type="password"
              value={formData.password}
              onChange={handleChange}
            ></input>

            <label htmlFor="role" className="w-full">
              Role
            </label>
            <select
              id="role"
              name="role"
              className="w-full border mb-4 p-0.5"
              placeholder="Select a role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>

            {error && <div className="text-red-500 mb-2 text-sm">{error}</div>}

            <button
              disabled={loading}
              className="w-full h-10 text-white bg-gray-700 mt-4 hover:bg-gray-800 cursor-pointer "
              type="submit"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;
