// routes/AdminRoutes.jsx
import { Route } from "react-router-dom";
import ProtectedRoute from "../shared/components/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";

import AdminDashboard from "../modules/dashboard/AdminDashboard";
import EmployeeManagement from "../modules/employee/pages/EmployeeManagement";
import TaskManagement from "../modules/task/pages/TaskManagement";
import CustomerManagement from "../modules/customer/pages/CustomerManagement";
import ProductManagement from "../modules/product/pages/ProductManagement";
import QuotationManagement from "../modules/quotation/pages/QuotationManagement";
import OrderManagement from "../modules/order/pages/OrderManagement";
import AddQuotation from "../modules/quotation/pages/AddQuotation";
import QuotationDetails from "../modules/quotation/pages/QuotationDetails";
import Profile from "../modules/profile/Profile";

export const AdminRoutes = (
  <Route
    element={
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    <Route path="/admin/employees" element={<EmployeeManagement />} />
    <Route path="/admin/tasks" element={<TaskManagement />} />
    <Route path="/admin/customers" element={<CustomerManagement />} />
    <Route path="/admin/products" element={<ProductManagement />} />
    <Route path="/admin/quotations" element={<QuotationManagement />} />
    <Route path="/admin/add-quotation" element={<AddQuotation role="admin" />} />
    <Route path="/admin/quotations/:quotationId" element={<QuotationDetails />} />
    <Route path="/admin/orders" element={<OrderManagement />} />
    <Route path="/admin/profile" element={<Profile />} />
  </Route>
);
