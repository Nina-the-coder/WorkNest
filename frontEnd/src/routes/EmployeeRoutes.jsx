// routes/EmployeeRoutes.jsx
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "../shared/components/ProtectedRoute";
import EmployeeLayout from "../layouts/EmployeeLayout";

import EmployeeDashboard from "../modules/dashboard/EmployeeDashboard";
import AddQuotation from "../modules/quotation/pages/addQuotation/AddQuotation";
import QuotationManagement from "../modules/quotation/pages/QuotationManagement";
import QuotationDetails from "../modules/quotation/pages/quotationDetails/QuotationDetails";
import Profile from "../modules/profile/Profile";
import EmployeeTaskManagement from "../modules/task/pages/EmployeeTaskManagement";
import EmployeeTaskDetails from "../modules/task/pages/EmployeeTaskDetails";
import CustomerManagement from "../modules/customer/pages/CustomerManagement";
import CustomerDetails from "../modules/customer/pages/CustomerDetails";
import ProductManagement from "../modules/product/pages/ProductManagement";
import NotFound from "../pages/NotFound";

const withPermission = (element, permission) => (
  <ProtectedRoute requiredPermissions={[permission]}>{element}</ProtectedRoute>
);

export const EmployeeRoutes = (
  <Route
    element={
      <ProtectedRoute allowedRoles={["employee"]}>
        <EmployeeLayout />
      </ProtectedRoute>
    }
  >
    <Route path="/employee" element={<Navigate to="/employee/dashboard" replace />} />
    <Route path="/employee/dashboard" element={withPermission(<EmployeeDashboard />, "DASHBOARD_READ")} />
    <Route path="/employee/tasks" element={withPermission(<EmployeeTaskManagement />, "TASK_READ")} />
    <Route path="/employee/tasks/:taskId" element={withPermission(<EmployeeTaskDetails />, "TASK_READ")} />
    <Route path="/employee/customers" element={withPermission(<CustomerManagement />, "CUSTOMER_READ")} />
    <Route path="/employee/customers/:customerId" element={withPermission(<CustomerDetails />, "CUSTOMER_READ")} />
    <Route path="/employee/products" element={withPermission(<ProductManagement />, "PRODUCT_READ")} />
    <Route
      path="/employee/quotation"
      element={withPermission(<AddQuotation role="employee" />, "QUOTATION_CREATE")}
    />
    <Route
      path="/employee/quotations"
      element={withPermission(<QuotationManagement role="employee" />, "QUOTATION_READ")}
    />
    <Route
      path="/employee/quotations/:quotationId"
      element={withPermission(<QuotationDetails role="employee" />, "QUOTATION_READ")}
    />
    <Route
      path="/employee/quotations/:quotationId/edit"
      element={withPermission(<AddQuotation role="employee" />, "QUOTATION_UPDATE")}
    />
    <Route path="/employee/profile" element={<Profile />} />
    <Route path="/employee/*" element={<NotFound />} />
  </Route>
);
