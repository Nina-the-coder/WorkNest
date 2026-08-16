import React from "react";
// import tailwind
import "./App.css";
import { Routes, Route } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import { AdminRoutes } from "./routes/AdminRoutes";
import { EmployeeRoutes } from "./routes/EmployeeRoutes";
import Login from "../src/modules/auth/pages/Login";
import Unauthorized from "./pages/Unauthorized";
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Login />} />
        </Route>

        {/* Unauthorized page */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Admin */}
        {AdminRoutes}

        {/* Employee */}
        {EmployeeRoutes}
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
