import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiCalendar,
  FiFileText,
  FiPackage,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import Header from "../../../../shared/components/Header";
import { useAuth } from "../../../auth/useAuth";
import api from "../../../../api/axios";
import { calculateFormQuotationPricing, formatCurrency, getOriginalQuotationItem } from "../../quotation.util";
import {
  createQuotationAPI,
  fetchQuotationAPI,
  submitQuotationAPI,
  updateQuotationAPI,
  reopenQuotationAPI,
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

};

const referenceId = (value) => value?._id || value || "";
const quotationForm = (quotation) => ({
  customerId: referenceId(quotation.customerId),
  employeeId: referenceId(quotation.employeeId),
  validUntil: quotation.validUntil ? quotation.validUntil.slice(0, 10) : "",
  notes: quotation.notes || "",
  // Persisted snapshots are authoritative, even when the current Product changes.
  items: (quotation.items || []).map((item) => ({
    ...item,
    productId: referenceId(item.productId),
  })),
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const inputClass =
  "mt-2 w-full rounded-xl border border-border-color bg-bg px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-gray-400 focus:border-cta focus:ring-2 focus:ring-cta/10";

const actionClass = "flex min-h-10 w-full items-center justify-center rounded-xl border-2 px-3 py-2 text-sm disabled:cursor-wait disabled:opacity-50";

/* -------------------------------------------------------------------------- */
/* Add Quotation                                                              */
/* -------------------------------------------------------------------------- */

const AddQuotation = ({ role }) => {
  const navigate = useNavigate();
  const { quotationId } = useParams();
  const { user } = useAuth();
  const editingId = quotationId;
  const isEditMode = Boolean(editingId);

  const [form, setForm] = useState(blank);
  const [discountModes, setDiscountModes] = useState({});
  const [formRoute, setFormRoute] = useState(editingId);
  const routeVersion = useRef(0);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [quotationNumber, setQuotationNumber] = useState("");
  const [quotationStatus, setQuotationStatus] = useState("");
  const [loadedQuotation, setLoadedQuotation] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [quotationError, setQuotationError] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [loadVersion, setLoadVersion] = useState(0);
  const [productsError, setProductsError] = useState("");
  const activeRoute = useRef(editingId);
  activeRoute.current = editingId;
  const savingRef = useRef(false);

  const [productsLoading, setProductsLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState("");
  const [customersLoading, setCustomersLoading] = useState(true);
  const [customersError, setCustomersError] = useState("");
  const [loadingQuotation, setLoadingQuotation] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const canAssign = role === "admin" && user?.permissions?.includes("EMPLOYEE_READ");
  const canSave = user?.permissions?.includes(isEditMode || savedId ? "QUOTATION_UPDATE" : "QUOTATION_CREATE");
  const canSubmit = user?.permissions?.includes("QUOTATION_SUBMIT");
  const listPath = role === "admin" ? "/admin/quotations" : "/employee/quotations";

  const fetchCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setCustomersError("");
    try {
      const { data } = await api.get("/api/customers");
      setCustomers(data || []);
    } catch (error) {
      setCustomersError(error.response?.data?.message || "Unable to load customers");
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const { data } = await api.get("/api/products");
      setProducts(data || []);
    } catch (error) {
      setProductsError(error.response?.data?.message || "Unable to load products");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (!canAssign) return;
    setEmployeesLoading(true);
    setEmployeesError("");
    try {
      const { data } = await api.get("/api/employees");
      setEmployees(data || []);
    } catch (error) {
      setEmployeesError(error.response?.data?.message || "Unable to load employees");
    } finally {
      setEmployeesLoading(false);
    }
  }, [canAssign]);

  useEffect(() => {
    void fetchCustomers();
    void fetchProducts();
    void fetchEmployees();
  }, [fetchCustomers, fetchProducts, fetchEmployees]);

  useEffect(() => {
    let current = true;
    routeVersion.current += 1;
    setFormRoute(editingId);
    setForm({ ...blank, items: [] });
    setDiscountModes({});
    setLoadedQuotation(null);
    setQuotationError(null);
    setSaveError("");
    setSavedId(null);
    setQuotationStatus("");
    setQuotationNumber("");
    setSaving(false);
    savingRef.current = false;
    setLoadingQuotation(Boolean(editingId));
    if (!editingId) return () => { current = false; routeVersion.current += 1; };

    const loadQuotation = async () => {
      try {
        const { data } = await fetchQuotationAPI(editingId);
        if (!current) return;
        setLoadedQuotation(data.quotation);
        setQuotationStatus(data.quotation.status);
        setQuotationNumber(data.quotation.quotationId || "");
        setForm(quotationForm(data.quotation));
      } catch (error) {
        if (!current) return;
        setQuotationError({
          status: error.response?.status,
          message: error.response?.data?.message || "Unable to load quotation",
        });
      } finally {
        if (current) setLoadingQuotation(false);
      }
    };
    void loadQuotation();
    return () => { current = false; routeVersion.current += 1; };
  }, [editingId, loadVersion]);

  /* ------------------------------------------------------------------------ */
  /* Calculations                                                             */
  /* ------------------------------------------------------------------------ */

  const pricing = useMemo(() => {
    try { return { totals: calculateFormQuotationPricing(form.items, loadedQuotation?.items), error: "" }; }
    catch (error) { return { totals: null, error: error.message }; }
  }, [form.items, loadedQuotation]);
  const previewAmount = (field) => pricing.totals ? formatCurrency(pricing.totals[field]) : "—";

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
    const changes = typeof field === "string" ? { [field]: value } : field;
    if (field === "discountPercentage") {
      // Keep zero in percentage mode and prevent an old stored amount from
      // becoming a hidden fallback when the percentage is cleared.
      setDiscountModes((previous) => ({ ...previous, [referenceId(form.items[index].productId)]: "percentage" }));
      changes.discountAmount = 0;
    }
    setForm((previous) => ({
      ...previous,
      items: previous.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ...changes }
          : item,
      ),
    }));
  };

  const discountMode = (item) => discountModes[referenceId(item.productId)] ||
    (Number(item.discountPercentage) > 0 ? "percentage" : "amount");
  const changeDiscountMode = (index, mode) => {
    setDiscountModes((previous) => ({ ...previous, [referenceId(form.items[index].productId)]: mode }));
    updateItem(index, { discountAmount: 0, discountPercentage: 0 });
  };

  const removeItem = (index) => {
    update(
      "items",
      form.items.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Save quotation                                                           */
  /* ------------------------------------------------------------------------ */

  const save = async (submit) => {
    if (savingRef.current || !canSave || (submit && !canSubmit)) return;
    setSaveError("");
    const fail = (message) => { setSaveError(message); };
    if (quotationStatus && !["DRAFT", "REJECTED"].includes(quotationStatus)) {
      return fail("This quotation is locked and cannot be edited.");
    }
    if (!form.customerId) return fail("Please select a customer.");
    const unchangedCustomer = loadedQuotation && String(referenceId(loadedQuotation.customerId)) === String(form.customerId);
    const validCustomer = customers.some((customer) =>
      String(customer._id) === String(form.customerId) && !customer.deleted &&
      (!customer.status || customer.status === "active"));
    if (!unchangedCustomer && !validCustomer) return fail("Please select a valid existing customer.");

    const employeeId = role === "admin" ? form.employeeId || (!canAssign ? user?._id : "") : undefined;
    if (role === "admin") {
      const unchangedEmployee = loadedQuotation && String(referenceId(loadedQuotation.employeeId)) === String(employeeId);
      const validEmployee = employees.some((employee) =>
        String(employee._id) === String(employeeId) && !employee.deleted &&
        (!employee.status || employee.status === "active"));
      if (!employeeId || (!unchangedEmployee && !validEmployee && String(employeeId) !== String(user?._id))) {
        return fail("Please select a valid existing employee.");
      }
    }
    if (!form.validUntil) return fail("Please select a validity date.");
    if (!Number.isFinite(new Date(form.validUntil).getTime()) || new Date(form.validUntil).getTime() <= Date.now()) {
      return fail("Please select a future validity date.");
    }
    if (!form.items.length) return fail("Please add at least one product.");
    if (pricing.error) return fail(pricing.error);
    const meaningfulNumber = (value) => value !== "" && value !== null && value !== undefined &&
      typeof value !== "boolean" && Number.isFinite(Number(value));
    for (const item of form.items) {
      if (!meaningfulNumber(item.quantity) || !Number.isSafeInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
        return fail("Product quantities must be positive whole numbers.");
      }
      if (!meaningfulNumber(item.unitPrice) || Number(item.unitPrice) < 0) return fail("Product prices must be zero or greater.");
      for (const field of ["discountAmount", "discountPercentage", "gstRate"]) {
        if (item[field] !== undefined && (!meaningfulNumber(item[field]) || Number(item[field]) < 0 ||
          (field !== "discountAmount" && Number(item[field]) > 100))) {
          return fail("Enter valid discounts and GST rates between 0 and 100%.");
        }
      }
      if (!(Number(item.discountPercentage) > 0) && Number(item.discountAmount || 0) > Number(item.quantity) * Number(item.unitPrice)) {
        return fail("An item discount cannot exceed its subtotal.");
      }
    }

    savingRef.current = true;
    setSaving(true);
    const version = routeVersion.current;
    const isCurrent = () => version === routeVersion.current && activeRoute.current === editingId;
    let persistedId = savedId || editingId;
    try {
      const payload = {
        customerId: form.customerId,
        validUntil: form.validUntil,
        notes: form.notes,
        items: form.items,
        ...(role === "admin" ? { employeeId } : {}),
      };
      const { data } = persistedId
        ? await updateQuotationAPI(persistedId, payload)
        : await createQuotationAPI(payload);
      persistedId = data.quotation._id;
      if (!isCurrent()) return;
      // Retain the saved identity if a later reopen/submit request fails.
      setSavedId(persistedId);
      setLoadedQuotation((previous) => {
        const complete = { ...data.quotation };
        // Mutation responses can contain raw refs; keep matching display data
        // if a later workflow request fails and the form remains open.
        for (const field of ["customerId", "employeeId"]) {
          if (previous?.[field]?._id && String(referenceId(previous[field])) === String(referenceId(complete[field]))) {
            complete[field] = previous[field];
          }
        }
        return complete;
      });
      setQuotationStatus(data.quotation.status);
      setQuotationNumber(data.quotation.quotationId || "");
      setForm(quotationForm(data.quotation));
      if (data.quotation.status === "REJECTED") {
        await reopenQuotationAPI(persistedId);
        if (!isCurrent()) return;
        setQuotationStatus("DRAFT");
      }
      if (submit) await submitQuotationAPI(persistedId);
      if (!isCurrent()) return;
      toast.success(submit ? "Quotation submitted successfully" : "Draft saved successfully");
      navigate(isEditMode || submit ? `${listPath}/${persistedId}` : listPath);
    } catch (error) {
      if (!isCurrent()) return;
      const message = error.response?.data?.message || "Unable to save quotation";
      setSaveError(persistedId && !editingId
        ? `Draft ${quotationNumber || "saved"} is saved. ${message} Retry will update this draft.`
        : message);
    } finally {
      if (isCurrent()) {
        savingRef.current = false;
        setSaving(false);
      }
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Loading state                                                             */
  /* ------------------------------------------------------------------------ */

  if (formRoute !== editingId || loadingQuotation) {
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

  if (quotationError || (quotationStatus && !["DRAFT", "REJECTED"].includes(quotationStatus))) {
    return (
      <div className="flex flex-col gap-5">
        <Header title="Edit Quotation" />
        <div role="alert" className="rounded-2xl border border-border-color bg-card-bg p-6 text-text">
          <p>{quotationError
            ? quotationError.status === 404 ? "Quotation not found or unavailable to you."
              : quotationError.status === 403 ? "You do not have permission to edit this quotation." : quotationError.message
            : "This quotation is locked and cannot be edited."}</p>
          {quotationError && <button type="button" className="mt-3 mr-4 underline" onClick={() => setLoadVersion((value) => value + 1)}>Retry</button>}
          <button type="button" className="mt-3 underline" onClick={() => navigate(quotationError ? listPath : `${listPath}/${editingId || savedId}`)}>
            {quotationError ? "Back to quotations" : "View quotation"}
          </button>
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
          onClick={() =>
            navigate(
              role === "admin" ? "/admin/quotations" : "/employee/quotations",
            )
          }
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
      <fieldset disabled={saving} className="min-w-0" aria-busy={saving}>
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
                  currentCustomer={loadedQuotation?.customerId}
                  loading={customersLoading}
                  error={customersError}
                  onRetry={fetchCustomers}
                  onChange={(customerId) => update("customerId", customerId)}
                />
              </FormField>

              {canAssign && (
                <FormField label="Created For" icon={FiUsers} required>
                  <EmployeeSelector
                    employees={employees}
                    employeeId={form.employeeId}
                    currentEmployee={loadedQuotation?.employeeId || (String(form.employeeId) === String(user?._id) ? user : null)}
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
                  aria-label="Valid Until"
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
              error={productsError}
              onRetry={fetchProducts}
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
                            originalItem={getOriginalQuotationItem(item, loadedQuotation?.items)}
                            index={index}
                            updateItem={updateItem}
                            removeItem={removeItem}
                            discountMode={discountMode(item)}
                            onDiscountModeChange={(mode) => changeDiscountMode(index, mode)}
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
                      originalItem={getOriginalQuotationItem(item, loadedQuotation?.items)}
                      index={index}
                      updateItem={updateItem}
                      removeItem={removeItem}
                      discountMode={discountMode(item)}
                      onDiscountModeChange={(mode) => changeDiscountMode(index, mode)}
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
              aria-label="Additional notes"
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
                    {previewAmount("subtotal")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Discount</span>

                  <span className="font-medium text-red">
                    - {previewAmount("discountAmount")}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">GST</span>

                  <span className="font-medium text-text">
                    {previewAmount("gstAmount")}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-bg p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Grand Total</p>

                    <p className="mt-1 text-xl font-bold text-text sm:text-2xl">
                      {previewAmount("grandTotal")}
                    </p>
                  </div>
                </div>
              </div>

              {saveError && <p role="alert" className="text-sm text-red">{saveError}</p>}
              {pricing.error && <p role="alert" className="text-sm text-red">Correct the item pricing: {pricing.error}</p>}
              {!canSave && <p role="alert" className="text-sm text-red">You do not have permission to save this quotation.</p>}
              {canSubmit && <div className="pt-1">
                <button type="button" disabled={saving || !canSave || Boolean(pricing.error)}
                  onClick={() => save(true)}
                  className={`${actionClass} border-cta bg-cta text-white`}
                >{
                    saving
                      ? "Submitting..."
                      : editingId || savedId
                        ? "Update & Submit"
                        : "Save & Submit"
                  }</button>
              </div>}

              <button type="button" disabled={saving || !canSave || Boolean(pricing.error)}
                onClick={() => save(false)}
                className={`${actionClass} border-cta/60 text-text`}
              >{saving ? "Saving..." : "Save as Draft"}</button>

              <button type="button" disabled={saving}
                onClick={() => navigate(-1)}
                className={`${actionClass} border-red/60 text-text`}
              >Cancel</button>
            </div>
          </div>
        </aside>
      </div>
      </fieldset>
    </div>
  );
};

export default AddQuotation;
