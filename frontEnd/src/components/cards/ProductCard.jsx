import React from "react";
import VariantButton from "../buttons/VariantButton";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const ProductCard = ({ product, handleEdit, handleDelete }) => {
  return (
    <div
      key={product._id}
      className="bg-card-bg/50 rounded-2xl shadow-md shadow-secondary-text/30 flex flex-col h-[400px] text-secondary-text"
    >
      {/* Image */}
      <div className="w-full h-[280px] bg-gray-700 rounded-md overflow-hidden mb-3 flex items-center justify-center">
        <img
          src={`${BASE_URL}/uploads/${product.image}`}
          alt={product.name}
          className="w-full h-full object-fill"
        />
      </div>
      {/* Title */}
      <div className="p-2">
        <div className="text-text text-xl font-semibold truncate">
          {product.name}
        </div>
        {/* ID & Price */}
        <div className="flex justify-between items-center text-sm mb-2">
          <div className="underline">{product.productId}</div>
          <div className="text-text text-[20px]">₹ {product.price}</div>
        </div>
        {/* Description */}
        <div className="h-[75px] text-[16px] line-clamp-4 text-justify">
          {product.description}
        </div>
        {/* buttons */}
        <div className="align-baseline flex justify-evenly mt-6 mb-2">
          <VariantButton
            onClick={handleEdit}
            variant="ghostCta"
            size="small"
            text="Edit"
            icon="pen"
          />
          <VariantButton
            variant="ghostRed"
            onClick={handleDelete}
            size="small"
            text="Delete"
            icon="trash-2"
          />
        </div>{" "}
      </div>
    </div>
  );
};

export default ProductCard;
