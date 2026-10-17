// modules/product/components/ProductGrid.jsx
import ProductCard from "../components/ProductCard";

const ProductGrid = ({ products, handleEdit, handleDelete, canEdit = false, canArchive = false }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full px-4">
      {products.map((product) => (
        <ProductCard
          key={product._id || product.productId}
          product={product}
          canEdit={canEdit}
          canArchive={canArchive}
          handleEdit={(e) => handleEdit(e, product)}
          handleDelete={(e) => handleDelete(e, product.productId)}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
