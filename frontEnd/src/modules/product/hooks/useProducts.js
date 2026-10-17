// modules/product/hooks/useProducts.js
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  getProductsAPI,
  createProductAPI,
  updateProductAPI,
  deleteProductAPI,
} from "../services/product.api";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestVersion = useRef(0);

  const refreshProducts = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const res = await getProductsAPI();
      if (version !== requestVersion.current) return false;
      setProducts(res.data);
      return true;
    } catch (err) {
      if (version === requestVersion.current) {
        setError({
          status: err.response?.status,
          message: err.response?.data?.message || "Unable to load products. Please try again.",
        });
        if ([401, 403, 404].includes(err.response?.status)) setProducts([]);
      }
      return false;
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  const addProduct = async (formData) => {
    await createProductAPI(formData);
    toast.success("Product added successfully");
    await refreshProducts();
  };

  const editProduct = async (id, formData) => {
    await updateProductAPI(id, formData);
    toast.success("Product updated successfully");
    await refreshProducts();
  };

  const removeProduct = async (id) => {
    await deleteProductAPI(id);
    toast.success("Product deleted successfully");
    await refreshProducts();
  };

  useEffect(() => {
    void refreshProducts();
    const onFocus = () => {
      if (document.visibilityState !== "hidden") void refreshProducts();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      requestVersion.current += 1;
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshProducts]);

  return {
    products,
    loading,
    error,
    refreshProducts,
    addProduct,
    editProduct,
    removeProduct,
  };
};
