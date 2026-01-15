import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ThemeToggle from "../components/buttons/ThemeToggle";
import Icon from "../components/Icons";
import WorkNestDark from "../assets/WorkNest-dark.svg";
import WorkNestLight from "../assets/WorkNest-light.svg";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const res = await axios.post(`${BASE_URL}/api/auth/login`, formData);
      console.log(res.data);

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
    <div className="h-screen w-full bg-gradient-to-r from-[#304352] to-[#d7d2cc]">
      <div className="navbar h-[60px] p-1.5 w-full flex justify-between ">
        {/* Light mode logo */}
        <img
          src={WorkNestLight}
          alt="WorkNest"
          className="block dark:hidden h-10"
        />

        {/* Dark mode logo */}
        <img
          src={WorkNestDark}
          alt="WorkNest"
          className="hidden dark:block h-10"
        />

        <ThemeToggle />
      </div>
      <div className="main flex flex-col justify-center items-center mt-8">
        <div className="login h-[410px] w-[440px] p-8 my-8 bg-card-bg rounded-2xl">
          <div className="text-[30px] font-extrabold mt-4 mb-8 text-center text-text">
            Welcome Back
          </div>

          <form onSubmit={handleLogin}>
            <label
              htmlFor="email"
              type="email"
              className="w-full text-[16px] ml-4 text-text/90"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              className="w-[380px] h-[28px] p-0.5 rounded-xl bg-white mb-8"
              type="text"
              value={formData.email}
              onChange={handleChange}
            ></input>
            <label
              htmlFor="password"
              className="w-full text-[16px] ml-4 text-text/90"
            >
              Password
            </label>
            <div className="flex">
              <input
                id="password"
                name="password"
                className="w-[350px] h-[28px] p-0.5 rounded-l-xl mb-4 bg-white"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="h-[28px] w-[30px] flex items-center rounded-r-xl bg-white justify-center hover:cursor-pointer "
              >
                {showPassword ? (
                  <Icon name="eye" />
                ) : (
                  <Icon name="eye-closed" className="h-[20px] w-[20px] " />
                )}
              </button>
            </div>

            {error && <div className="text-rose-500 mb-2 text-sm">{error}</div>}
            <div className="flex justify-center items-center mt-8">
              <button
                disabled={loading}
                className="w-[168px] h-[50px] text-white text-lg bg-cta hover:bg-cta/80 rounded-2xl cursor-pointer "
                type="submit"
              >
                {loading ? (
                  "Logging in..."
                ) : (
                  <div>
                    <span className="text-[20px] font-semibold">Login</span>{" "}
                    <Icon
                      name="arrow-big-right"
                      className="inline h-[20px] w-[20px] ml-2 "
                    />{" "}
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
