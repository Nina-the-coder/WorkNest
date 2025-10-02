import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import Header from "../components/Header";
import SearchBar from "../components/SearchBar";
import CTAButton from "../components/buttons/CTAButton";
import ProductCard from "../components/cards/ProductCard";
import VariantButton from "../components/buttons/VariantButton";
import { toast } from "react-toastify";
import SkeletonLoader from "../components/SkeletonLoader";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const ProductManagement = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    price: "",
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave(e);
    }
  };

  const handleAddNewProduct = () => {
    console.log("adding the new product");
    setModal(true);
  };

  const handleCancel = () => {
    console.log("cancel the edit or adding the product");
    setFormData({
      name: "",
      description: "",
      image: null,
      price: "",
    });
    setModal(false);
    setIsEdit(false);
    setEditProductId(null);
    setError("");
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/api/admin/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error in fetching the products form the database...", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async (e) => {
    setLoading(true);
    e.preventDefault();
    e.stopPropagation();
    if (!formData.name || !formData.description || !formData.price) {
      toast.warn("Please fill all the requied fields");
      return;
    }
    if (formData.image) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(formData.image.type)) {
        toast.warn("Only JPG, JPEG, and PNG image types are allowed.");
        return;
      }
    }
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("image", formData.image);
    try {
      const token = localStorage.getItem("token");
      if (isEdit) {
        await axios.put(
          `${BASE_URL}/api/admin/products/${editProductId}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("product updated successfullly");
        toast.success("Product updated successfully");
        setIsEdit(false);
        setEditProductId(null);
      } else {
        if (!formData.image) {
          toast.warn("Please upload an image");
          return;
        }
        const res = await axios.post(
          `${BASE_URL}/api/admin/products`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Sending Product: ", res.data);
        toast.success("Product added successfully");
      }

      await fetchProducts();
      setFormData({
        name: "",
        description: "",
        image: null,
        price: "",
      });
      setModal(false);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "An error occurred while saving Product.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Editing the product", product);
    setIsEdit(true);
    setEditProductId(product.productId);
    setFormData({
      name: product.name,
      description: product.description,
      // image: product.image,
      price: product.price,
    });
    setModal(true);
  };

  const handleDeleteProduct = async (e, productId) => {
    setLoading(true);
    e.preventDefault();
    e.stopPropagation();
    const confirmDelete = window.confirm(
      `Are you sure you want to delete product ${productId}?`
    );
    if (!confirmDelete) return;
    console.log("deleting the product", productId);
    try {
      await axios.delete(`${BASE_URL}/api/admin/products/${productId}`);
      await fetchProducts();
      console.log("Product deleted successfully");
    } catch (err) {
      console.error("Error in deleting the product", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesProduct =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesProduct;
  });

  return (
    <div className="flex min-h-screen">
      {/* main */}
      <div className="w-full p-4 flex flex-col items-center bg-bg">
        {/* header */}
        <Header title="Product Management" />

        {/* modal */}
        {modal && (
          <div className="w-[460px] h-fit rounded-2xl mt-16 p-8 bg-card-bg bg-gradient-to-r from-bg/80 to-card-bg/0 transition-all duration-300">
            <div className="text-[20px] flex items-center justify-center mb-8 ml-4 text-text">
              {isEdit ? "Edit Product" : "Add New Product"}
            </div>
            <form
              className="flex flex-col items-center gap-1"
              onKeyDown={(e) => handleKeyDown(e)}
            >
              <label
                htmlFor="name"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
              />

              <label
                htmlFor="description"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Description
              </label>
              <textarea
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-[380px] h-[56px] p-0.5 rounded-xl mb-4 bg-white"
              />

              <label
                htmlFor="image"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Upload Image
              </label>
              <input
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                id="image"
                name="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    image: e.target.files[0],
                  }));
                }}
              />
              {formData.image && (
                <img
                  src={URL.createObjectURL(formData.image)}
                  alt="Preview"
                  className="w-32 h-32 object-cover mt-2"
                />
              )}

              <label
                htmlFor="price"
                className="w-full text-[16px] ml-4 text-text/90"
              >
                Price
              </label>
              <input
                className="w-[380px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
              />

              <div className="flex justify-around items-center gap-[50px] mt-4">
                <VariantButton
                  onClick={handleCancel}
                  variant="ghostRed"
                  size="medium"
                  text="Cancel"
                  icon="x"
                />
                <VariantButton
                  onClick={handleSave}
                  variant="cta"
                  size="medium"
                  text="Save"
                  icon="check"
                />
              </div>
            </form>
          </div>
        )}

        {/* Search Bar and CTA button */}
        {!modal && (
          <div className="flex gap-4 my-14 px-10 w-full">
            <div className="w-full lg:w-fit flex gap-4">
              <SearchBar
                placeholder="Searh for the product by name or description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="lg:ml-10">
              <CTAButton onClick={handleAddNewProduct} icon="plus">
                <div className="text-left mb-1">Add new</div>
                <div className="text-left">Product</div>
              </CTAButton>
            </div>
          </div>
        )}

        {/* container */}
        {!modal &&
          (loading ? (
            <div className="w-full p-4 gap-4">
              <SkeletonLoader count={6} className="flex flex-wrap gap-4" />
            </div>
          ) : (
            <div className="overflow-auto h-[500px] w-full pb-4 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  handleDelete={(e) =>
                    handleDeleteProduct(e, product.productId)
                  }
                  handleEdit={(e) => handleEditProduct(e, product)}
                />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

export default ProductManagement;
