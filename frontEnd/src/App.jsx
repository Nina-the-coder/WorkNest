import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import AddQuotation from "./pages/AddQuotation";

import EmployeeDashboard from "./pages/employee/EmployeeDashboard";

import AdminDashboard from "./pages/admin/AdminDashboard";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import TaskManagement from "./pages/admin/TaskManagement";
import CustomerManagement from "./pages/admin/CustomerManagement";
import ProductManagement from "./pages/admin/ProductManagement";
import QuotationManagement from "./pages/admin/QuotationManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import ConversationManagement from "./pages/admin/ConversationManagement";
import Profile from "./pages/admin/Profile";

import { ToastContainer } from "react-toastify";
import Sidebar from "./components/Sidebar";

function App() {
  const location = useLocation();
  const hideSidebarRoutes = ["/", "/employee/dashboard", "/admin/add-quotation", "/employee/quotation"]; // login page only

  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);
  return (
    <div className="App flex min-h-screen">
      {shouldShowSidebar && <Sidebar />}
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />}></Route>

        {/* Admin Route */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <TaskManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <CustomerManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ProductManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quotations"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <QuotationManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/add-quotation"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AddQuotation role="admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <OrderManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/conversations"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ConversationManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Employee Route */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/quotation"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <AddQuotation />
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;
