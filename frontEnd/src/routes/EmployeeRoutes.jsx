// routes/EmployeeRoutes.jsx
import { Route } from "react-router-dom";
import ProtectedRoute from "../shared/components/ProtectedRoute";
import EmployeeLayout from "../layouts/EmployeeLayout";

import EmployeeDashboard from "../modules/dashboard/EmployeeDashboard";
import AddQuotation from "../modules/quotation/pages/addQuotation/AddQuotation";
import QuotationManagement from "../modules/quotation/pages/QuotationManagement";
import QuotationDetails from "../modules/quotation/pages/quotationDetails/QuotationDetails";

export const EmployeeRoutes = (
  <Route
    element={
      <ProtectedRoute allowedRoles={["employee"]}>
        <EmployeeLayout />
      </ProtectedRoute>
    }
  >
    <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
    <Route path="/employee/quotation" element={<AddQuotation />} />
    <Route
      path="/employee/quotations"
      element={<QuotationManagement role="employee" />}
    />
    <Route
      path="/employee/quotations/:quotationId"
      element={<QuotationDetails />}
    />
  </Route>
);
