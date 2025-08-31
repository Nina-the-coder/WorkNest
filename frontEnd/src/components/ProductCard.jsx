import React from "react";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;


const ProductCard = ({ product, handleEditProduct, handleDeleteProduct }) => {
  return (
    <div
      key={product._id}
      className="bg-card-bg p-2 rounded-2xl shadow-md flex flex-col h-[400px] text-secondary-text"
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
      <div className="text-text text-xl font-semibold truncate">
        {product.name}
      </div>
      {/* ID & Price */}
      <div className="flex justify-between text-sm mb-2">
        <div>{product.productId}</div>
        <div className="">₹ {product.price}</div>
      </div>
      {/* Description */}
      <div className="h-[80px] text-sm line-clamp-4 text-justify">
        {product.description}
      </div>
      {/* buttons */}
      <div className="align-baseline flex justify-evenly mt-4">
        <button
          onClick={handleEditProduct}
          className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
        >
          Edit
        </button>
        <button
          onClick={handleDeleteProduct}
          className="p-1 w-20 bg-indigo-800 hover:bg-indigo-900 text-white hover:cursor-pointer"
        >
          Delete
        </button>
      </div>{" "}
    </div>
  );
};

export default ProductCard;
