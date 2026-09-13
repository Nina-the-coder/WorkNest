import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiFileText,
  FiPackage,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import Header from "../../../../shared/components/Header";
import VariantButton from "../../../../shared/components/buttons/VariantButton";
import api from "../../../../api/axios";
import { calculateQuotationTotals, formatCurrency } from "../../quotation.util";
import {
  createQuotationAPI,
  fetchQuotationAPI,
  submitQuotationAPI,
  updateQuotationAPI,
} from "../../services/quotation.api";
import Section from "./components/Section";
import FormField from "./components/FormField";
import ProductCard from "./components/ProductCard";
import ProductTableRow from "./components/ProductTableRow";
import ProductSelector from "./components/ProductSelector";
import CustomerSelector from "./components/CustomerSelector";
import EmployeeSelector from "./components/EmployeeSelector";

const blank = {
  customerId: "",
  employeeId: "",
  validUntil: "",
  notes: "",
  items: [],

  customerDetails: {
    contact: "",
    address: "",
    gst: "",
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const inputClass =
  "mt-2 w-full rounded-xl border border-border-color bg-bg px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-gray-400 focus:border-cta focus:ring-2 focus:ring-cta/10";

const selectClass =
  "mt-2 w-full appearance-none rounded-xl border border-border-color bg-bg px-3.5 py-3 pr-10 text-sm text-text outline-none transition focus:border-cta focus:ring-2 focus:ring-cta/10";

/* -------------------------------------------------------------------------- */
/* Add Quotation                                                              */
/* -------------------------------------------------------------------------- */

const AddQuotation = ({ role }) => {
  const navigate = useNavigate();
  const { quotationId } = useParams();
  // const location = useLocation();
  // const editingId = location.state?.quotation?._id;
  const editingId = quotationId;
  const isEditMode = Boolean(editingId);

  const [form, setForm] = useState(blank);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [quotationNumber, setQuotationNumber] = useState("");

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState("");
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState("");
  const [loadingQuotation, setLoadingQuotation] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Load quotation options                                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const loadOptions = async () => {
      setProductsLoading(true);

      if (role === "admin") {
        setEmployeesLoading(true);
        setEmployeesError("");
      }

      try {
        const requests = [
          api.get("/api/products"),
          role === "admin"
            ? api.get("/api/employees")
            : Promise.resolve({ data: [] }),
        ];

        const [productResponse, employeeResponse] = await Promise.all(requests);

        setProducts(productResponse.data || []);
        setEmployees(employeeResponse.data || []);
      } catch (error) {
        const message =
          error.response?.data?.message || "Unable to load quotation options";

        toast.error(message);

        if (role === "admin") {
          setEmployeesError(message);
        }
      } finally {
        setProductsLoading(false);

        if (role === "admin") {
          setEmployeesLoading(false);
        }
      }
    };

    loadOptions();
  }, [role]);

  /* ------------------------------------------------------------------------ */
  /* Load quotation when editing                                              */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!editingId) return;

    const loadQuotation = async () => {
      setLoadingQuotation(true);

      try {
        const { data } = await fetchQuotationAPI(editingId);
        const quotation = data.quotation;
        setQuotationNumber(quotation.quotationId || "");

        setForm({
          customerId: quotation.customerId?._id || quotation.customerId || "",

          employeeId: quotation.employeeId?._id || quotation.employeeId || "",

          validUntil: quotation.validUntil
            ? quotation.validUntil.slice(0, 10)
            : "",

          notes: quotation.notes || "",

          customerDetails: {
            contact: quotation.customerDetails?.contact || "",
            address: quotation.customerDetails?.address || "",
            gst: quotation.customerDetails?.gst || "",
          },

          items: (quotation.items || []).map((item) => ({
            ...item,

            productId: item.productId?._id || item.productId,

            productName: item.productName || item.productId?.name || "",

            sku: item.sku || item.productId?.productId || "",

            description: item.description || item.productId?.description || "",
          })),
        });
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to load quotation",
        );
      } finally {
        setLoadingQuotation(false);
      }
    };
    console.log("form", form);

    loadQuotation();
  }, [editingId]);

  /* ------------------------------------------------------------------------ */
  /* Calculations                                                             */
  /* ------------------------------------------------------------------------ */

  const totals = useMemo(
    () => calculateQuotationTotals(form.items),
    [form.items],
  );

  /* ------------------------------------------------------------------------ */
  /* Form helpers                                                             */
  /* ------------------------------------------------------------------------ */

  const update = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateItem = (index, field, value) => {
    update(
      "items",
      form.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value === "" ? "" : Number(value),
            }
          : item,
      ),
    );
  };

  const removeItem = (index) => {
    update(
      "items",
      form.items.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const fetchCustomers = async () => {
    setCustomersLoading(true);
    setCustomersError("");

    try {
      const response = await api.get("/api/customers");

      setCustomers(response.data || []);
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to load customers";

      setCustomersError(message);

      toast.error(message);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);

    try {
      const response = await api.get("/api/products");
      setProducts(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load products");
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setEmployeesLoading(true);
    setEmployeesError("");

    try {
      const response = await api.get("/api/employees");

      setEmployees(response.data || []);
    } catch (error) {
      const message =
        error.response?.data?.message || "Unable to load employees";

      setEmployeesError(message);
      toast.error(message);
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchEmployees();
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Save quotation                                                           */
  /* ------------------------------------------------------------------------ */

  const save = async (submit) => {
    if (!form.customerId) {
      return toast.error("Please select a customer.");
    }

    const isValidCustomer = customers.some(
      (customer) =>
        String(customer._id) === String(form.customerId) &&
        !customer.deleted &&
        (!customer.status || customer.status === "active"),
    );

    if (!isValidCustomer) {
      return toast.error("Please select a valid existing customer.");
    }

    const isValidEmployee =
      role !== "admin" ||
      employees.some(
        (employee) =>
          String(employee._id) === String(form.employeeId) &&
          !employee.deleted &&
          (!employee.status || employee.status === "active"),
      );

    if (!isValidEmployee) {
      return toast.error("Please select a valid existing employee.");
    }

    if (!form.validUntil) {
      return toast.error("Please select a validity date.");
    }

    if (form.items.length === 0) {
      return toast.error("Please add at least one product.");
    }

    if (role === "admin" && !form.employeeId) {
      return toast.error("Please select an employee.");
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        employeeId: role === "admin" ? form.employeeId : undefined,
      };

      const response = editingId
        ? await updateQuotationAPI(editingId, payload)
        : await createQuotationAPI(payload);

      if (submit) {
        await submitQuotationAPI(response.data.quotation._id);
      }

      toast.success(
        submit
          ? "Quotation submitted successfully"
          : "Draft saved successfully",
      );

      if (editingId) {
        navigate(
          role === "admin"
            ? `/admin/quotations/${editingId}`
            : `/employee/quotations/${editingId}`,
        );
      } else {
        navigate(
          role === "admin" ? "/admin/quotations" : "/employee/quotations",
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save quotation");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Loading state                                                             */
  /* ------------------------------------------------------------------------ */

  if (loadingQuotation) {
    return (
      <div className="flex flex-col gap-5">
        <Header title={editingId ? "Edit Quotation" : "New Quotation"} />

        <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-border-color bg-card-bg">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-border-color border-t-cta" />

            <p className="mt-3 text-sm text-gray-500">Loading quotation...</p>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */
  return (
    <div className="flex min-w-0 flex-col gap-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(role === "admin" ? "/admin/quotations" : "/employee/quotations")}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color bg-card-bg text-gray-500 transition hover:text-text"
          title="Go back"
        >
          <FiArrowLeft size={18} />
        </button>

        <div>
          <Header title={isEditMode ? "Edit Quotation" : "New Quotation"} />

          {isEditMode && (
            <p className="mt-1 text-sm text-gray-500">
              {quotationNumber} · Update quotation details
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left column */}
        <div className="min-w-0 space-y-5">
          {/* Quotation details */}
          <Section
            icon={FiFileText}
            title="Quotation Details"
            description="Select the customer and define the quotation validity."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Customer" icon={FiUser} required>
                <CustomerSelector
                  customers={customers}
                  customerId={form.customerId}
                  loading={customersLoading}
                  error={customersError}
                  onRetry={fetchCustomers}
                  onChange={(customerId) => update("customerId", customerId)}
                  onCustomerDetailsChange={(details) =>
                    update("customerDetails", details)
                  }
                />
              </FormField>

              {role === "admin" && (
                <FormField label="Created For" icon={FiUsers} required>
                  <EmployeeSelector
                    employees={employees}
                    employeeId={form.employeeId}
                    loading={employeesLoading}
                    error={employeesError}
                    onRetry={fetchEmployees}
                    onChange={(employeeId) => update("employeeId", employeeId)}
                  />
                </FormField>
              )}

              <FormField
                label="Valid Until"
                icon={FiCalendar}
                required
                className={role !== "admin" ? "md:max-w-[50%]" : ""}
              >
                <input
                  className={inputClass}
                  type="date"
                  min={new Date(Date.now() + 86400000)
                    .toISOString()
                    .slice(0, 10)}
                  value={form.validUntil}
                  onChange={(e) => update("validUntil", e.target.value)}
                />
              </FormField>
            </div>
          </Section>

          {/* Products */}
          <Section
            icon={FiPackage}
            title="Products & Services"
            description="Add products and configure their pricing."
          >
            {/* Product selector */}
            <ProductSelector
              products={products}
              loading={productsLoading}
              error=""
              onRetry={() => {}}
              form={form}
              update={update}
            />

            {/* Empty state */}
            {form.items.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-border-color px-5 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cta/10 text-cta">
                  <FiPackage size={22} />
                </div>

                <h3 className="mt-3 text-sm font-semibold text-text">
                  No products added
                </h3>

                <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500 sm:text-sm">
                  Select a product above to start building this quotation.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="mt-5 hidden overflow-hidden rounded-xl border border-border-color lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left">
                      <thead className="bg-bg">
                        <tr className="text-xs uppercase tracking-wide text-gray-500">
                          <th className="px-4 py-3 font-medium">Product</th>
                          <th className="px-3 py-3 font-medium">Unit Price</th>
                          <th className="px-3 py-3 font-medium">Qty</th>
                          <th className="px-3 py-3 font-medium">Discount</th>
                          <th className="px-3 py-3 font-medium">GST</th>
                          <th className="px-3 py-3 text-right font-medium">
                            Total
                          </th>
                          <th className="w-14 px-4 py-3" />
                        </tr>
                      </thead>

                      <tbody>
                        {form.items.map((item, index) => (
                          <ProductTableRow
                            key={`${item.productId}-${index}`}
                            item={item}
                            index={index}
                            updateItem={updateItem}
                            removeItem={removeItem}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile / Tablet */}
                <div className="mt-5 space-y-3 lg:hidden">
                  {form.items.map((item, index) => (
                    <ProductCard
                      key={`${item.productId}-${index}`}
                      item={item}
                      index={index}
                      updateItem={updateItem}
                      removeItem={removeItem}
                    />
                  ))}
                </div>
              </>
            )}
          </Section>

          {/* Notes */}
          <Section
            icon={FiFileText}
            title="Additional Notes"
            description="Add any terms, delivery information, or remarks."
          >
            <textarea
              className={`${inputClass} min-h-[120px] resize-y`}
              placeholder="Add notes or special terms..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </Section>
        </div>

        {/* Right column / Summary */}
        <aside className="min-w-0">
          <div className="sticky top-5 overflow-hidden rounded-2xl border border-border-color bg-card-bg">
            <div className="border-b border-border-color px-5 py-4">
              <h2 className="text-base font-semibold text-text">
                Quotation Summary
              </h2>

              <p className="mt-0.5 text-xs text-gray-500">
                Review the final quotation amount.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Items</span>

                <span className="font-medium text-text">
                  {form.items.length}
                </span>
              </div>

              <div className="h-px bg-border-color" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>

                  <span className="font-medium text-text">
                    {formatCurrency(totals.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Discount</span>

                  <span className="font-medium text-red">
                    - {formatCurrency(totals.discountAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">GST</span>

                  <span className="font-medium text-text">
                    {formatCurrency(totals.gstAmount)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-bg p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Grand Total</p>

                    <p className="mt-1 text-xl font-bold text-text sm:text-2xl">
                      {formatCurrency(totals.grandTotal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <VariantButton
                  onClick={() => save(true)}
                  variant="cta"
                  size="medium"
                  text={
                    saving
                      ? "Submitting..."
                      : editingId
                        ? "Update & Submit"
                        : "Save & Submit"
                  }
                />
              </div>

              <VariantButton
                onClick={() => save(false)}
                variant="ghostCta"
                size="medium"
                text={saving ? "Saving..." : "Save as Draft"}
              />

              <VariantButton
                onClick={() => navigate(-1)}
                variant="ghostRed"
                size="medium"
                text="Cancel"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AddQuotation;
