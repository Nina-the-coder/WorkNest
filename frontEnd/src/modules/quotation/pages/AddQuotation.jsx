import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiFileText,
  FiMinus,
  FiPackage,
  FiPlus,
  FiTrash2,
  FiUser,
  FiUsers,
} from "react-icons/fi";

import Header from "../../../shared/components/Header";
import VariantButton from "../../../shared/components/buttons/VariantButton";
import api from "../../../api/axios";

import { calculateQuotationTotals, formatCurrency } from "../quotation.util";
import {
  createQuotationAPI,
  fetchQuotationAPI,
  submitQuotationAPI,
  updateQuotationAPI,
} from "../services/quotation.api";

const blank = {
  customerId: "",
  employeeId: "",
  validUntil: "",
  notes: "",
  items: [],
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const inputClass =
  "mt-2 w-full rounded-xl border border-border-color bg-bg px-3.5 py-3 text-sm text-text outline-none transition placeholder:text-gray-400 focus:border-cta focus:ring-2 focus:ring-cta/10";

const selectClass =
  "mt-2 w-full appearance-none rounded-xl border border-border-color bg-bg px-3.5 py-3 pr-10 text-sm text-text outline-none transition focus:border-cta focus:ring-2 focus:ring-cta/10";

const numberInputClass =
  "w-full rounded-lg border border-border-color bg-bg px-2.5 py-2 text-sm text-text outline-none transition focus:border-cta focus:ring-2 focus:ring-cta/10";

/* -------------------------------------------------------------------------- */
/* Form Field                                                                 */
/* -------------------------------------------------------------------------- */

const FormField = ({
  label,
  icon: Icon,
  required,
  children,
  className = "",
}) => {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-center gap-2 text-sm font-medium text-text">
        {Icon && <Icon className="text-gray-500" size={15} />}
        {label}
        {required && <span className="text-red">*</span>}
      </span>

      {children}
    </label>
  );
};

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

const Section = ({ icon: Icon, title, description, children }) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-border-color bg-card-bg">
      <div className="border-b border-border-color px-4 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
            <Icon size={18} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-text sm:text-base">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">{children}</div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Product Row - Desktop                                                      */
/* -------------------------------------------------------------------------- */

const ProductTableRow = ({ item, index, updateItem, removeItem }) => {
  const lineTotal =
    (Number(item.quantity) * Number(item.unitPrice) -
      Number(item.discountAmount || 0)) *
    (1 + Number(item.gstRate ?? 18) / 100);

  return (
    <tr className="border-b border-border-color last:border-0">
      <td className="px-4 py-4">
        <div className="font-medium text-text">{item.productName}</div>
        <div className="mt-0.5 text-xs text-gray-500">
          Product #{String(item.productId?._id || item.productId).slice(-6)}
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="w-28">
          <input
            className={numberInputClass}
            type="number"
            min="0"
            value={item.unitPrice}
            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
          />
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="flex w-24 items-center rounded-lg border border-border-color bg-bg">
          <button
            type="button"
            className="flex h-9 w-8 items-center justify-center text-gray-500 transition hover:text-text"
            onClick={() =>
              updateItem(
                index,
                "quantity",
                Math.max(1, Number(item.quantity || 1) - 1),
              )
            }
          >
            <FiMinus size={13} />
          </button>

          <input
            className="h-9 min-w-0 flex-1 border-x border-border-color bg-transparent text-center text-sm text-text outline-none"
            type="number"
            min="1"
            step="1"
            value={item.quantity}
            onChange={(e) => updateItem(index, "quantity", e.target.value)}
          />

          <button
            type="button"
            className="flex h-9 w-8 items-center justify-center text-gray-500 transition hover:text-text"
            onClick={() =>
              updateItem(index, "quantity", Number(item.quantity || 0) + 1)
            }
          >
            <FiPlus size={13} />
          </button>
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="w-24">
          <input
            className={numberInputClass}
            type="number"
            min="0"
            value={item.discountAmount || 0}
            onChange={(e) =>
              updateItem(index, "discountAmount", e.target.value)
            }
          />
        </div>
      </td>

      <td className="px-3 py-4">
        <div className="w-20">
          <input
            className={numberInputClass}
            type="number"
            min="0"
            max="100"
            value={item.gstRate ?? 18}
            onChange={(e) => updateItem(index, "gstRate", e.target.value)}
          />
        </div>
      </td>

      <td className="whitespace-nowrap px-3 py-4 text-right font-semibold text-text">
        {formatCurrency(lineTotal)}
      </td>

      <td className="px-4 py-4 text-right">
        <button
          type="button"
          title="Remove product"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red/10 hover:text-red"
          onClick={() => removeItem(index)}
        >
          <FiTrash2 size={16} />
        </button>
      </td>
    </tr>
  );
};

/* -------------------------------------------------------------------------- */
/* Product Card - Mobile                                                      */
/* -------------------------------------------------------------------------- */

const ProductCard = ({ item, index, updateItem, removeItem }) => {
  const lineTotal =
    (Number(item.quantity) * Number(item.unitPrice) -
      Number(item.discountAmount || 0)) *
    (1 + Number(item.gstRate ?? 18) / 100);

  return (
    <div className="rounded-xl border border-border-color bg-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-text">
            {item.productName}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Product #{String(item.productId?._id || item.productId).slice(-6)}
          </p>
        </div>

        <button
          type="button"
          title="Remove product"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red/10 hover:text-red"
          onClick={() => removeItem(index)}
        >
          <FiTrash2 size={15} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label>
          <span className="text-xs font-medium text-gray-500">Unit Price</span>

          <input
            className={`${numberInputClass} mt-1.5`}
            type="number"
            min="0"
            value={item.unitPrice}
            onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
          />
        </label>

        <label>
          <span className="text-xs font-medium text-gray-500">Quantity</span>

          <div className="mt-1.5 flex items-center rounded-lg border border-border-color bg-card-bg">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-gray-500"
              onClick={() =>
                updateItem(
                  index,
                  "quantity",
                  Math.max(1, Number(item.quantity || 1) - 1),
                )
              }
            >
              <FiMinus size={13} />
            </button>

            <input
              className="h-9 min-w-0 flex-1 border-x border-border-color bg-transparent text-center text-sm text-text outline-none"
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateItem(index, "quantity", e.target.value)}
            />

            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-gray-500"
              onClick={() =>
                updateItem(index, "quantity", Number(item.quantity || 0) + 1)
              }
            >
              <FiPlus size={13} />
            </button>
          </div>
        </label>

        <label>
          <span className="text-xs font-medium text-gray-500">Discount</span>

          <input
            className={`${numberInputClass} mt-1.5`}
            type="number"
            min="0"
            value={item.discountAmount || 0}
            onChange={(e) =>
              updateItem(index, "discountAmount", e.target.value)
            }
          />
        </label>

        <label>
          <span className="text-xs font-medium text-gray-500">GST %</span>

          <input
            className={`${numberInputClass} mt-1.5`}
            type="number"
            min="0"
            max="100"
            value={item.gstRate ?? 18}
            onChange={(e) => updateItem(index, "gstRate", e.target.value)}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border-color pt-3">
        <span className="text-xs font-medium text-gray-500">Line Total</span>

        <span className="text-sm font-bold text-text">
          {formatCurrency(lineTotal)}
        </span>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Add Quotation                                                              */
/* -------------------------------------------------------------------------- */

const AddQuotation = ({ role }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const editingId = location.state?.quotation?._id;

  const [form, setForm] = useState(blank);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingQuotation, setLoadingQuotation] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Load quotation options                                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);

      try {
        const [customerResponse, productResponse, employeeResponse] =
          await Promise.all([
            api.get("/api/customers"),
            api.get("/api/products"),
            role === "admin"
              ? api.get("/api/employees")
              : Promise.resolve({ data: [] }),
          ]);

        setCustomers(customerResponse.data || []);
        setProducts(productResponse.data || []);
        setEmployees(employeeResponse.data || []);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Unable to load quotation options",
        );
      } finally {
        setLoadingOptions(false);
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

        setForm({
          customerId: quotation.customerId?._id || quotation.customerId || "",

          employeeId: quotation.employeeId?._id || quotation.employeeId || "",

          validUntil: quotation.validUntil
            ? quotation.validUntil.slice(0, 10)
            : "",

          notes: quotation.notes || "",

          items: (quotation.items || []).map((item) => ({
            ...item,

            // Convert populated product object back to its ObjectId
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

  const addProduct = (id) => {
    if (!id) return;

    const product = products.find((p) => p._id === id);

    if (!product) return;

    const alreadyAdded = form.items.some(
      (item) => String(item.productId?._id || item.productId) === String(id),
    );

    if (alreadyAdded) {
      toast.info("This product is already added.");
      return;
    }

    update("items", [
      ...form.items,
      {
        productId: id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        discountAmount: 0,
        gstRate: 18,
      },
    ]);
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

  /* ------------------------------------------------------------------------ */
  /* Save quotation                                                           */
  /* ------------------------------------------------------------------------ */

  const save = async (submit) => {
    if (!form.customerId) {
      return toast.error("Please select a customer.");
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

      navigate(role === "admin" ? "/admin/quotations" : "/employee/quotations");
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
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-color bg-card-bg text-gray-500 transition hover:text-text"
          title="Go back"
        >
          <FiArrowLeft size={18} />
        </button>

        <div className="min-w-0 flex-1">
          <Header title={editingId ? "Edit Quotation" : "New Quotation"} />
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
                <div className="relative">
                  <select
                    className={selectClass}
                    value={form.customerId}
                    onChange={(e) => update("customerId", e.target.value)}
                    disabled={loadingOptions}
                  >
                    <option value="">Select customer</option>

                    {customers
                      .filter(
                        (customer) =>
                          !customer.deleted &&
                          (!customer.status || customer.status === "active"),
                      )
                      .map((customer) => (
                        <option key={customer._id} value={customer._id}>
                          {customer.name} ({customer.customerId})
                        </option>
                      ))}
                  </select>

                  <FiChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                </div>
              </FormField>

              {role === "admin" && (
                <FormField label="Created For" icon={FiUsers} required>
                  <div className="relative">
                    <select
                      className={selectClass}
                      value={form.employeeId}
                      onChange={(e) => update("employeeId", e.target.value)}
                      disabled={loadingOptions}
                    >
                      <option value="">Select employee</option>

                      {employees
                        .filter(
                          (employee) =>
                            employee.status === "active" && !employee.deleted,
                        )
                        .map((employee) => (
                          <option key={employee._id} value={employee._id}>
                            {employee.name} ({employee.empId})
                          </option>
                        ))}
                    </select>

                    <FiChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <FormField label="Add Product">
                  <div className="relative">
                    <select
                      className={selectClass}
                      value=""
                      onChange={(e) => addProduct(e.target.value)}
                      disabled={loadingOptions}
                    >
                      <option value="">
                        {loadingOptions
                          ? "Loading products..."
                          : "Select a product to add"}
                      </option>

                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} — {formatCurrency(product.price)}
                        </option>
                      ))}
                    </select>

                    <FiChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 mt-1 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                  </div>
                </FormField>
              </div>

              <div className="hidden pb-0.5 text-xs text-gray-500 sm:block">
                {form.items.length} {form.items.length === 1 ? "item" : "items"}{" "}
                added
              </div>
            </div>

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
