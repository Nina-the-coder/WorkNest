import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import './App.css'
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeManagement from "./pages/EmployeeManagement";
import TaskManagement from "./pages/TaskManagement";
import EmployeeDashboard from "./pages/EmployeeDashboard";

function App() {

  return (
    <>
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path = "/login" element={<Login />}></Route>

        {/* Admin Route */}
        <Route path = "/admin/dashboard" element={<AdminDashboard />}></Route>
        <Route path = "/admin/employees" element={<EmployeeManagement />}></Route>
        <Route path = "/admin/tasks" element={<TaskManagement />}></Route>

        {/* Employee Route */}
        <Route path = "employee/dashboard" element={<EmployeeDashboard />}></Route>
      </Routes>
    </Router>
    </>
  )
}

export default App;
