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

const EmployeeSelector = ({
  employees,
  employeeId,
  loading,
  error,
  onRetry,
  onChange,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Active employees                                                         */
  /* ------------------------------------------------------------------------ */

  const activeEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          !employee.deleted &&
          (!employee.status || employee.status === "active"),
      ),
    [employees],
  );

  /* ------------------------------------------------------------------------ */
  /* Selected employee                                                        */
  /* ------------------------------------------------------------------------ */

  const selectedEmployee = useMemo(
    () =>
      activeEmployees.find(
        (employee) => String(employee._id) === String(employeeId),
      ),
    [activeEmployees, employeeId],
  );

  /* ------------------------------------------------------------------------ */
  /* Search                                                                   */
  /* ------------------------------------------------------------------------ */

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return activeEmployees;
    }

    return activeEmployees.filter((employee) => {
      const name = employee.name?.toLowerCase() || "";
      const employeeNumber = employee.empId?.toLowerCase() || "";
      const contact = employee.contact?.toLowerCase() || "";
      const email = employee.email?.toLowerCase() || "";

      return (
        name.includes(query) ||
        employeeNumber.includes(query) ||
        contact.includes(query) ||
        email.includes(query)
      );
    });
  }, [activeEmployees, search]);

  /* ------------------------------------------------------------------------ */
  /* Select employee                                                          */
  /* ------------------------------------------------------------------------ */

  const handleSelect = (employee) => {
    onChange(employee._id);
    setSearch("");
    setOpen(false);
  };

  /* ------------------------------------------------------------------------ */
  /* Clear employee                                                           */
  /* ------------------------------------------------------------------------ */

  const handleClear = () => {
    onChange("");
    setSearch("");
    setOpen(false);
  };

  /* ------------------------------------------------------------------------ */
  /* Close dropdown when focus leaves selector                                */
  /* ------------------------------------------------------------------------ */

  const handleBlur = (event) => {
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
        Loading employees...
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
              Unable to load employees
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

  if (activeEmployees.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-dashed border-border-color bg-bg px-4 py-5 text-center">
        <FiUser
          className="mx-auto text-gray-400"
          size={20}
        />

        <p className="mt-2 text-sm font-medium text-text">
          No employees available
        </p>

        <p className="mt-1 text-xs text-gray-500">
          Create an employee first before assigning this quotation.
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
      {/* Selected employee                                                   */}
      {/* ------------------------------------------------------------------ */}

      {selectedEmployee ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border-color bg-bg px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
              <FiUser size={16} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">
                {selectedEmployee.name}
              </p>

              {selectedEmployee.empId && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {selectedEmployee.empId}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red/10 hover:text-red"
            title="Change employee"
          >
            <FiX size={16} />
          </button>
        </div>
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
              placeholder="Search employees..."
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
          {/* Employee dropdown                                                 */}
          {/* ---------------------------------------------------------------- */}

          {open && (
            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-border-color bg-card-bg shadow-lg">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <button
                    key={employee._id}
                    type="button"
                    onClick={() => handleSelect(employee)}
                    className="flex w-full items-center gap-3 border-b border-border-color/50 px-4 py-3 text-left transition last:border-b-0 hover:bg-bg"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
                      <FiUser size={16} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-text">
                        {employee.name}
                      </p>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                        {employee.empId && (
                          <span>{employee.empId}</span>
                        )}

                        {employee.contact && (
                          <span>{employee.contact}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm font-medium text-text">
                    No matching employees
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Try a different name, employee ID, or contact.
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

export default EmployeeSelector;