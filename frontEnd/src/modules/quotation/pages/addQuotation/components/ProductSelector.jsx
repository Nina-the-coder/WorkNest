import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiChevronDown,
  FiLoader,
  FiPackage,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-toastify";

import FormField from "../components/FormField";
import { formatCurrency } from "../../../quotation.util";

const ProductSelector = ({
  products,
  loading,
  error,
  onRetry,
  form,
  update,
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  /* ------------------------------------------------------------------------ */
  /* Active products                                                          */
  /* ------------------------------------------------------------------------ */

  const activeProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          !product.deleted && (!product.status || product.status === "active"),
      ),
    [products],
  );

  /* ------------------------------------------------------------------------ */
  /* Products not already added                                               */
  /* ------------------------------------------------------------------------ */

  const availableProducts = useMemo(() => {
    const addedIds = new Set(
      form.items.map((item) => String(item.productId?._id || item.productId)),
    );

    return activeProducts.filter(
      (product) => !addedIds.has(String(product._id)),
    );
  }, [activeProducts, form.items]);

  /* ------------------------------------------------------------------------ */
  /* Search                                                                   */
  /* ------------------------------------------------------------------------ */

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return availableProducts;
    }

    return availableProducts.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const productId = product.productId?.toLowerCase() || "";
      const sku = product.sku?.toLowerCase() || "";
      const description = product.description?.toLowerCase() || "";

      return (
        name.includes(query) ||
        productId.includes(query) ||
        sku.includes(query) ||
        description.includes(query)
      );
    });
  }, [availableProducts, search]);

  /* ------------------------------------------------------------------------ */
  /* Select product                                                           */
  /* ------------------------------------------------------------------------ */

  const handleSelect = (product) => {
    if (!product) return;

    const alreadyAdded = form.items.some(
      (item) =>
        String(item.productId?._id || item.productId) === String(product._id),
    );

    if (alreadyAdded) {
      toast.info("This product is already added.");
      return;
    }

    update("items", [
      ...form.items,
      {
        productId: product._id,
        productName: product.name || "",
        sku: product.sku || product.productId || "",
        description: product.description || "",
        quantity: 1,
        unitPrice: Number(product.price || 0),
        discountAmount: 0,
        gstRate: Number(product.gstRate ?? 18),
      },
    ]);

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
      <FormField label="Add Product">
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-border-color bg-bg px-3.5 py-3 text-sm text-gray-500">
          <FiLoader size={16} className="animate-spin" />
          Loading products...
        </div>
      </FormField>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Error                                                                    */
  /* ------------------------------------------------------------------------ */

  if (error) {
    return (
      <FormField label="Add Product">
        <div className="mt-2 rounded-xl border border-red/20 bg-red/5 p-4">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="mt-0.5 shrink-0 text-red" size={17} />

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text">
                Unable to load products
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">{error}</p>

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
      </FormField>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* No products                                                              */
  /* ------------------------------------------------------------------------ */

  if (activeProducts.length === 0) {
    return (
      <FormField label="Add Product">
        <div className="mt-2 rounded-xl border border-dashed border-border-color bg-bg px-4 py-6 text-center">
          <FiPackage className="mx-auto text-gray-400" size={22} />

          <p className="mt-2 text-sm font-medium text-text">
            No products available
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Create an active product first before creating a quotation.
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
      </FormField>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* All products already added                                               */
  /* ------------------------------------------------------------------------ */

  if (availableProducts.length === 0) {
    return (
      <FormField label="Add Product">
        <div className="mt-2 rounded-xl border border-dashed border-border-color bg-bg px-4 py-6 text-center">
          <FiPackage className="mx-auto text-gray-400" size={22} />

          <p className="mt-2 text-sm font-medium text-text">
            All products have been added
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Remove a product from the quotation if you want to add it again.
          </p>
        </div>
      </FormField>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Selector                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="relative z-50 min-w-0" onBlur={handleBlur}>
      <FormField label="Add Product">
        {/* Search box */}
        <div className="relative mt-2">
          <FiSearch
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={17}
          />

          <input
            type="text"
            value={search}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setSearch(event.target.value);
              setOpen(true);
            }}
            placeholder="Search products..."
            className="w-full rounded-xl border border-border-color bg-bg py-3 pl-10 pr-10 text-sm text-text outline-none transition placeholder:text-gray-400 focus:border-cta focus:ring-2 focus:ring-cta/10"
          />

          <FiChevronDown
            className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            size={17}
          />
        </div>

        {/* Dropdown */}
        {open && (
          <div className="absolute left-0 right-0 top-[72px] z-[100]">
            <div className="max-h-72 overflow-y-auto rounded-xl border border-border-color bg-card-bg shadow-xl">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onClick={() => handleSelect(product)}
                    className="flex w-full items-center gap-3 border-b border-border-color/50 px-4 py-3 text-left transition last:border-b-0 hover:bg-bg"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cta/10 text-cta">
                      <FiPackage size={17} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {product.name}
                      </p>

                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
                        {(product.productId || product.sku) && (
                          <span>{product.productId || product.sku}</span>
                        )}

                        <span>{formatCurrency(product.price || 0)}</span>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-7 text-center">
                  <p className="text-sm font-medium text-text">
                    No matching products
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Try a different product name, ID, or SKU.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </FormField>

      {/* Item count */}
      <div className="mt-2 hidden pb-0.5 text-xs text-gray-500 sm:block">
        {form.items.length} {form.items.length === 1 ? "item" : "items"} added
      </div>
    </div>
  );
};

export default ProductSelector;
