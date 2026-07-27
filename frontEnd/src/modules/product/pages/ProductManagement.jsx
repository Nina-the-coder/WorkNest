// modules/product/pages/ProductManagement.jsx
import { useState } from "react";
import Header from "../../../shared/components/Header";
import SkeletonLoader from "../../../shared/components/SkeletonLoader";
import ProductModal from "../components/ProductModal";
import ProductFilters from "../components/ProductFilters";
import ProductGrid from "../components/ProductGrid";
import { useProducts } from "../hooks/useProducts";
import { toast } from "react-toastify";

const ProductManagement = () => {
  const { products, loading, addProduct, editProduct, removeProduct } =
    useProducts();

  const [modal, setModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.price) {
      toast.warn("Please fill all required fields");
      return;
    }

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) =>
      formDataToSend.append(key, formData[key]),
    );

    if (isEdit) {
      await editProduct(editProductId, formDataToSend);
    } else {
      await addProduct(formDataToSend);
    }

    setModal(false);
    resetForm();
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="pb-100">
      <Header title="Product Management" />

      {modal ? (
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
      ) : (
        <>
          <ProductFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            openModal={() => setModal(true)}
          />

          {loading ? (
            <SkeletonLoader count={6} />
          ) : (
            <ProductGrid
              products={filteredProducts}
              handleEdit={(e, product) => {
                e.preventDefault();
                setIsEdit(true);
                setEditProductId(product.productId);
                setFormData(product);
                setModal(true);
              }}
              handleDelete={(e, id) => {
                e.preventDefault();
                removeProduct(id);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProductManagement;
