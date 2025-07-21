import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const ProductManagement = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null,
    price: "",
  });
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
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
      const res = await axios.get(`${BASE_URL}/api/admin/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error in fetching the products form the database...", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.price) {
      setError("Please fill all the requied fields");
      return;
    }
    if (formData.image) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(formData.image.type)) {
        setError("Only JPG, JPEG, and PNG image types are allowed.");
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
        setIsEdit(false);
        setEditProductId(null);
      } else {
        if(!formData.image){
          setError("Please upload an image");
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
      }

      await fetchProducts();
      setFormData({
        name: "",
        description: "",
        image: null,
        price: "",
      });
      setModal(false);
      setError("");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "An error occurred while saving Product.";
      setError(message);
    }
  };

  const handleEditProduct = async (product) => {
    console.log("Editing the product", product);
    setIsEdit(true);
    setEditProductId(product.productId);
    setFormData({
      name: product.name,
      description: product.description,
      // image: product.image,
      price: product.price
    });
    setModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    try{
      await axios.delete(`${BASE_URL}/api/admin/products/${productId}`);
      await fetchProducts();
      console.log("Product deleted successfully");
    }catch(err){
      console.error("Error in deleting the product", err);
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesProduct =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesProduct;
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      {/* main */}
      <div className="ml-64 w-full p-4 flex flex-col items-center bg-slate-900">
        {/* header */}
        <div className="w-full flex justify-between text-white">
          <div className="text-3xl">Product Management</div>
          <div className="text-3xl pr-4">Admin</div>
        </div>

        {/* modal */}
        {modal && (
          <div className="w-100 h-fit mt-16 p-8 border bg-slate-800">
            <div className="text-3xl mb-8 ml-4 text-white">
              {isEdit ? "Edit Product" : "Add New Product"}
            </div>
            <form>
              <label htmlFor="name" className="w-full text-lg text-slate-200">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
              />

              <label
                htmlFor="description"
                className="w-full text-lg text-slate-200"
              >
                Description
              </label>
              <textarea
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="border w-full p-0.5 h-20 rounded-xs mb-4 bg-slate-200"
              />

              <label htmlFor="image" className="text-lg mr-1.5 text-slate-200">
                Upload Image
              </label>
              <input
                className="border bg-slate-300 p-0.5 rounded-xs w-full mb-4 hover:cursor-pointer"
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

              <label htmlFor="price" className="w-full text-lg text-slate-200">
                Price
              </label>
              <input
                className="border w-full p-0.5 rounded-xs mb-4 bg-slate-200"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
              />

              {error && (
                <div className="text-rose-500 mb-2 text-sm mt-4">{error}</div>
              )}
              <div className="flex justify-around items-center">
                <button
                  onClick={handleCancel}
                  className="mt-8 p-2 px-10 w-30 text-white text-lg hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSave}
                  className="mt-8 p-2 px-10 w-30 text-white text-lg hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar and CTA button */}
        {!modal && (
          <div className="flex my-16 px-10 h-20 w-full">
            <div className="h-full w-1/2 items-center flex">
              <input
                type="text"
                className="h-10 w-3/4 bg-white px-2"
                placeholder="Search Product by name, description"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="h-full w-1/4 items-center flex ml-20">
              <button
                className="border border-slate-800 p-8 w-full text-2xl rounded-xl text-white bg-indigo-800 hover:cursor-pointer hover:bg-indigo-900"
                onClick={handleAddNewProduct}
              >
                Add New Product
              </button>
            </div>
          </div>
        )}

        {/* container */}
        {!modal && (
          <div className="overflow-auto max-h-[500px] w-full pb-4 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-slate-800 p-2 rounded-lg shadow-md flex flex-col h-[400px]"
              >
                {/* Image */}
                <div className="w-full h-[180px] bg-gray-700 rounded-md overflow-hidden mb-3 flex items-center justify-center">
                  <img
                    src={`${BASE_URL}/uploads/${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-fill"
                  />
                </div>
                {/* Title */}
                <div className="text-white text-xl font-semibold truncate">
                  {product.name}
                </div>
                {/* ID & Price */}
                <div className="flex justify-between text-slate-300 text-sm mb-2">
                  <div>{product.productId}</div>
                  <div className="text-white">₹ {product.price}</div>
                </div>
                {/* Description */}
                <div className="text-slate-300 h-[80px] text-sm line-clamp-4 text-justify">
                  {product.description}
                </div>
                {/* buttons */}
                <div className="align-baseline flex justify-evenly mt-4">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.productId)}
                    className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
                  >
                    Delete
                  </button>
                </div>{" "}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductManagement;
