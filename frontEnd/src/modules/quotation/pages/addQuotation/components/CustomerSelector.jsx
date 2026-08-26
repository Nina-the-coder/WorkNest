import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiChevronDown,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiX,
} from "react-icons/fi";

import CustomerInformation from "./CustomerInformation";

const CustomerSelector = ({
  customers,
  customerId,
  loading,
  error,
  onRetry,
  onChange,
  onCustomerDetailsChange,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Active customers                                                         */
  /* ------------------------------------------------------------------------ */

  const activeCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          !customer.deleted &&
          (!customer.status || customer.status === "active"),
      ),
    [customers],
  );

  /* ------------------------------------------------------------------------ */
  /* Selected customer                                                        */
  /* ------------------------------------------------------------------------ */

  const selectedCustomer = useMemo(
    () =>
      activeCustomers.find(
        (customer) => String(customer._id) === String(customerId),
      ),
    [activeCustomers, customerId],
  );

  /* ------------------------------------------------------------------------ */
  /* Search                                                                   */
  /* ------------------------------------------------------------------------ */

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return activeCustomers;
    }

    return activeCustomers.filter((customer) => {
      const name = customer.name?.toLowerCase() || "";
      const customerNumber = customer.customerId?.toLowerCase() || "";
      const contact = customer.contact?.toLowerCase() || "";
      const email = customer.email?.toLowerCase() || "";

      return (
        name.includes(query) ||
        customerNumber.includes(query) ||
        contact.includes(query) ||
        email.includes(query)
      );
    });
  }, [activeCustomers, search]);

  /* ------------------------------------------------------------------------ */
  /* Select customer                                                          */
  /* ------------------------------------------------------------------------ */

  const handleSelect = (customer) => {
    onChange(customer._id);

    onCustomerDetailsChange({
      contact: customer.contact || "",
      address: customer.address || "",
      gst: customer.gstNumber || customer.gst || "",
    });

    setSearch("");
    setOpen(false);
  };

  /* ------------------------------------------------------------------------ */
  /* Clear customer                                                           */
  /* ------------------------------------------------------------------------ */

  const handleClear = () => {
    onChange("");

    onCustomerDetailsChange({
      contact: "",
      address: "",
      gst: "",
    });

    setSearch("");
    setOpen(false);
  };

  /* ------------------------------------------------------------------------ */
  /* Close dropdown when focus leaves selector                                */
  /* ------------------------------------------------------------------------ */

  const handleBlur = (event) => {
    /*
     * If the newly focused element is still inside this component,
     * don't close the dropdown.
     *
     * This allows clicking a customer option without the dropdown
     * disappearing before the click is processed.
     */
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-border-color bg-bg px-3.5 py-3 text-sm text-gray-500">
        <FiLoader size={16} className="animate-spin" />
        Loading customers...
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                    */
  /* ------------------------------------------------------------------------ */

  if (error) {
    return (
      <div className="mt-2 rounded-xl border border-red/20 bg-red/5 p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle
            className="mt-0.5 shrink-0 text-red"
            size={17}
          />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text">
              Unable to load customers
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red/20 px-3 py-2 text-xs font-medium text-red transition hover:bg-red/10"
            >
              <FiRefreshCw size={13} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Empty state                                                              */
  /* ------------------------------------------------------------------------ */

  if (activeCustomers.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-dashed border-border-color bg-bg px-4 py-5 text-center">
        <FiUser
          className="mx-auto text-gray-400"
          size={20}
        />

        <p className="mt-2 text-sm font-medium text-text">
          No customers available
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Create a customer first before creating a quotation.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-cta hover:underline"
        >
          <FiRefreshCw size={13} />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-w-0"
      onBlur={handleBlur}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Selected customer                                                   */}
      {/* ------------------------------------------------------------------ */}

      {selectedCustomer ? (
        <>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border-color bg-bg px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
                <FiUser size={16} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">
                  {selectedCustomer.name}
                </p>

                {selectedCustomer.customerId && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {selectedCustomer.customerId}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red/10 hover:text-red"
              title="Change customer"
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Customer information */}
          <CustomerInformation
            customer={selectedCustomer}
            onChange={onCustomerDetailsChange}
          />
        </>
      ) : (
        <>
          {/* ---------------------------------------------------------------- */}
          {/* Search input                                                      */}
          {/* ---------------------------------------------------------------- */}

          <div className="relative mt-2">
            <FiSearch
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={17}
            />

            <input
              type="text"
              value={search}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              placeholder="Search customers..."
              className="w-full rounded-xl border border-border-color bg-bg py-3 pl-10 pr-10 text-sm text-text outline-none transition placeholder:text-gray-400 focus:border-cta focus:ring-2 focus:ring-cta/10"
            />

            <FiChevronDown
              className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${
                open ? "rotate-180" : ""
              }`}
              size={17}
            />
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Customer dropdown                                                 */}
          {/* ---------------------------------------------------------------- */}

          {open && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border-color bg-card-bg shadow-lg">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <button
                    key={customer._id}
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className="flex w-full items-center gap-3 border-b border-border-color/50 px-4 py-3 text-left transition last:border-b-0 hover:bg-bg"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
                      <FiUser size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        {customer.name}
                      </p>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                        {customer.customerId && (
                          <span>{customer.customerId}</span>
                        )}

                        {customer.contact && (
                          <span>{customer.contact}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm font-medium text-text">
                    No matching customers
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Try a different name, customer ID, or contact.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CustomerSelector;