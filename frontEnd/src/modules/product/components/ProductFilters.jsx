// modules/product/components/ProductFilters.jsx
import SearchBar from "../../../shared/components/SearchBar";
import CTAButton from "../../../shared/components/buttons/CTAButton";

const ProductFilters = ({ searchQuery, setSearchQuery, openModal }) => {
  return (
    <div className="flex gap-8 my-10">
      <SearchBar
        placeholder="Search product by name or description"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <CTAButton onClick={openModal} icon="plus">
        Add Product
      </CTAButton>
    </div>
  );
};

export default ProductFilters;
