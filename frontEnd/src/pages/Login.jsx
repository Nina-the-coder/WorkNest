import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Worknestlogo from "../assets/WorknestLogo.jpg";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;


const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
        `${BASE_URL}/api/auth/login`,
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
      <div className="bg-slate-900 h-screen">
        <div className="navbar h-15 p-1.5 w-full bg-slate-300">
          <img className="h-full" src={Worknestlogo} />
        </div>
        <div className="main flex flex-col justify-center items-center mt-8">
          <div className="login h-fit w-100 p-8 mt-8 rounded-lg bg-slate-800">
            <div className="text-3xl mt-4 mb-8 text-center text-white">Login</div>
            <form onSubmit={handleLogin}>
              <label htmlFor="email" className="w-full text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                className="w-full border mb-4 p-0.5 bg-slate-200"
                type="text"
                value={formData.email}
                onChange={handleChange}
              ></input>
              <label htmlFor="password" className="w-full text-slate-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                className="w-full border mb-4 p-0.5 bg-slate-200"
                type="password"
                value={formData.password}
                onChange={handleChange}
              ></input>
              {error && <div className="text-rose-500 mb-2 text-sm">{error}</div>}
              <button
                disabled={loading}
                className="w-full h-10 text-white text-lg bg-indigo-800 mt-4 hover:bg-indigo-900 cursor-pointer "
                type="submit"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
