// modules/product/hooks/useProducts.js
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getProductsAPI,
  createProductAPI,
  updateProductAPI,
  deleteProductAPI,
} from "../services/product.api";

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getProductsAPI();
      setProducts(res.data);
    } catch (err) {
      toast.error("Error fetching products");
    } finally {
      setLoading(false);
    }
  };

  const addProduct = async (formData) => {
    await createProductAPI(formData);
    toast.success("Product added successfully");
    fetchProducts();
  };

  const editProduct = async (id, formData) => {
    await updateProductAPI(id, formData);
    toast.success("Product updated successfully");
    fetchProducts();
  };

  const removeProduct = async (id) => {
    await deleteProductAPI(id);
    toast.success("Product deleted successfully");
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    addProduct,
    editProduct,
    removeProduct,
  };
};