// routes/AdminRoutes.jsx
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../shared/components/ProtectedRoute";
import AdminLayout from "../layouts/AdminLayout";

import AdminDashboard from "../modules/dashboard/AdminDashboard";
import EmployeeManagement from "../modules/employee/pages/EmployeeManagement";
import TaskManagement from "../modules/task/pages/TaskManagement";
import CustomerManagement from "../modules/customer/pages/CustomerManagement";
import CustomerDetails from "../modules/customer/pages/CustomerDetails";
import ProductManagement from "../modules/product/pages/ProductManagement";
import QuotationManagement from "../modules/quotation/pages/QuotationManagement";
import OrderManagement from "../modules/order/pages/OrderManagement";
import OrderDetails from "../modules/order/pages/OrderDetails";
import AddQuotation from "../modules/quotation/pages/addQuotation/AddQuotation";
import QuotationDetails from "../modules/quotation/pages/quotationDetails/QuotationDetails";
import Profile from "../modules/profile/Profile";
import NotFound from "../pages/NotFound";

const withPermission = (element, permission) => (
  <ProtectedRoute requiredPermissions={[permission]}>{element}</ProtectedRoute>
);

export const AdminRoutes = (
  <Route
    element={
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    }
  >
    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="/admin/dashboard" element={withPermission(<AdminDashboard />, "DASHBOARD_READ")} />
    <Route path="/admin/employees" element={withPermission(<EmployeeManagement />, "EMPLOYEE_READ")} />
    <Route path="/admin/tasks" element={withPermission(<TaskManagement />, "TASK_READ")} />
    <Route path="/admin/customers" element={withPermission(<CustomerManagement />, "CUSTOMER_READ")} />
    <Route path="/admin/customers/:customerId" element={withPermission(<CustomerDetails />, "CUSTOMER_READ")} />
    <Route path="/admin/products" element={withPermission(<ProductManagement />, "PRODUCT_READ")} />

    <Route path="/admin/quotations" element={withPermission(<QuotationManagement role="admin" />, "QUOTATION_READ")} />
    <Route path="/admin/add-quotation" element={withPermission(<AddQuotation role="admin" />, "QUOTATION_CREATE")} />
    <Route path="/admin/quotations/:quotationId" element={withPermission(<QuotationDetails role="admin" />, "QUOTATION_READ")} />
    <Route path="/admin/quotations/:quotationId/edit" element={withPermission(<AddQuotation role="admin" />, "QUOTATION_UPDATE")} />

    <Route path="/admin/orders" element={withPermission(<OrderManagement />, "ORDER_READ")} />
    <Route path="/admin/orders/:orderId" element={withPermission(<OrderDetails />, "ORDER_READ")} />
    <Route path="/admin/profile" element={<Profile />} />
    <Route path="/admin/*" element={<NotFound />} />
  </Route>
);
