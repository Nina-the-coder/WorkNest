// modules/product/pages/ProductManagement.jsx
import { useRef, useState } from "react";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import ProductModal from "../components/ProductModal";
import ProductFilters from "../components/ProductFilters";
import ProductGrid from "../components/ProductGrid";
import { useProducts } from "../hooks/useProducts";
import { toast } from "react-toastify";
import { useAuth } from "../../auth/useAuth";

const ProductManagement = () => {
  const { products, loading, error, refreshProducts, addProduct, editProduct, removeProduct } =
    useProducts();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canCreate = isAdmin && user.permissions?.includes("PRODUCT_CREATE");
  const canEdit = isAdmin && user.permissions?.includes("PRODUCT_UPDATE");
  const canArchive = isAdmin && user.permissions?.includes("PRODUCT_ARCHIVE");

  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savingRef = useRef(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    price: "",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image: null,
      price: "",
    });
    setIsEdit(false);
    setEditProductId(null);
    setSaveError("");
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (savingRef.current || !(isEdit ? canEdit : canCreate)) return;
    if (!formData.name?.trim() || !formData.description?.trim() || formData.price === "" ||
      !Number.isFinite(Number(formData.price)) || Number(formData.price) < 0) {
      toast.warn("Please fill all required fields");
      return;
    }

    const formDataToSend = new FormData();
    for (const field of ["name", "description", "price"]) {
      formDataToSend.append(field, formData[field]);
    }
    if (formData.image instanceof File) formDataToSend.append("image", formData.image);

    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      if (isEdit) {
        await editProduct(editProductId, formDataToSend);
      } else {
        await addProduct(formDataToSend);
      }
      setModal(false);
      resetForm();
    } catch (failure) {
      setSaveError(failure.response?.data?.message || "Unable to save product. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((product) =>
    [product.name, product.description, product.productId].some(value =>
      String(value || "").toLowerCase().includes(query)),
  );

  return (
    <div className="pb-100">
      <Header title={isAdmin ? "Product Management" : "Product Catalog"} />

      {modal && (isEdit ? canEdit : canCreate) ? (
        <fieldset disabled={saving} aria-busy={saving}>
          {saveError && <p role="alert" className="mt-6 rounded-xl border border-red p-4 text-text">{saveError}</p>}
          <ProductModal
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            handleSave={handleSave}
            handleCancel={() => {
              resetForm();
              setModal(false);
            }}
            isEdit={isEdit}
          />
          {saving && <p role="status" className="mt-4 text-center text-secondary-text">Saving product…</p>}
        </fieldset>
      ) : (
        <>
          <ProductFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            openModal={() => setModal(true)}
            canCreate={canCreate}
          />

          <div className="mb-6 flex items-center justify-between gap-4">
            {!isAdmin && <p className="text-secondary-text">View available products and current prices. Product management is handled by Admin.</p>}
            <button type="button" onClick={refreshProducts} disabled={loading}
              className="ml-auto rounded-xl border border-cta px-4 py-2 text-text disabled:opacity-50">
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red p-4 text-text">
              <p>{error.status === 403 ? "You do not have permission to view products." : error.message}</p>
              <button type="button" onClick={refreshProducts} disabled={loading} className="mt-2 underline">Retry</button>
            </div>
          )}
          {loading && products.length === 0 ? (
            <SkeletonLoader count={6} />
          ) : (
            <div aria-busy={loading}>
              <ProductGrid
                products={filteredProducts}
                canEdit={canEdit}
                canArchive={canArchive}
                handleEdit={(e, product) => {
                  e.preventDefault();
                  if (!canEdit) return;
                  setIsEdit(true);
                  setEditProductId(product.productId);
                  setFormData(product);
                  setModal(true);
                }}
                handleDelete={async (e, id) => {
                  e.preventDefault();
                  if (!canArchive) return;
                  try {
                    await removeProduct(id);
                  } catch (failure) {
                    toast.error(failure.response?.data?.message || "Unable to delete product. Please try again.");
                  }
                }}
              />
              {!loading && !error && filteredProducts.length === 0 && (
                <p className="rounded-2xl bg-card-bg p-6 text-secondary-text">
                  {query ? "No products match your search." : "No products are available yet."}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductManagement;
