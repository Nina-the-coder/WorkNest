import { useState } from "react";
import { FiPackage } from "react-icons/fi";
import VariantButton from "../../../shared/components/buttons/VariantButton";
import api from "../../../api/axios";

const ProductCard = ({ product, handleEdit, handleDelete, canEdit = false, canArchive = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [failedImage, setFailedImage] = useState(null);
  const imageSource = product?.image ? `${api.defaults.baseURL || ""}/uploads/${product.image}` : null;

  const handleProductClick = () => setExpanded((p) => !p);

  return (
    <div
      onClick={handleProductClick}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && ["Enter", " "].includes(event.key)) {
          event.preventDefault();
          handleProductClick();
        }
      }}
      aria-expanded={expanded}
      aria-label={`${product?.name || "Product"} details`}
      className="relative h-[300px] overflow-hidden bg-card-bg/50 rounded-2xl shadow-md text-secondary-text cursor-pointer select-none touch-manipulation"
      role="button"
      tabIndex={0}
    >
      {/* --- Base (collapsed) view: image + quick info --- */}
      <div className="flex flex-col">
        {/* Image */}
        <div className="p-2 w-full h-[200px] rounded-t-2xl overflow-hidden mb-3 flex items-center justify-center">
          {imageSource && failedImage !== imageSource ? (
            <img
              src={imageSource}
              alt={product?.name || "Product"}
              onError={() => setFailedImage(imageSource)}
              className="w-full h-full rounded-xl"
            />
          ) : (
            <div role="img" aria-label={`${product?.name || "Product"} image unavailable`}
              className="flex h-full w-full items-center justify-center rounded-xl text-secondary-text">
              <FiPackage aria-hidden="true" className="h-16 w-16" />
            </div>
          )}
        </div>

        {/* Quick info under image */}
        <div className="pb-4 px-4">
          <div className="text-text text-[18px] font-bold truncate">
            {product?.name || "Untitled Product"}
          </div>
          <div className="flex justify-between items-center mt-1">
            <div className="underline text-[14px]">
              {product?.productId || "N/A"}
            </div>
            <div className="text-text text-[16px] font-semibold">
              ₹ {product?.price ?? "0.00"}
            </div>
          </div>
        </div>
      </div>

      {/* --- Sliding Drawer Overlay (covers entire card when open) --- */}
      <div
        aria-hidden={!expanded}
        className={`absolute inset-0 z-10 transform transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)]
                    will-change-transform ${
                      expanded ? "translate-y-0" : "translate-y-full"
                    }
                    ${
                      expanded ? "pointer-events-auto" : "pointer-events-none"
                    }`}
      >
        <div className="h-full w-full bg-card-bg rounded-2xl shadow-lg flex flex-col">
          {/* Handle bar for visual cue */}
          <div className="w-full flex justify-center pt-3 pb-2">
            <span className="h-1.5 w-12 rounded-full bg-secondary-text/30" />
          </div>

          {/* Drawer Header (same info, but inside overlay) */}
          <div className="px-4">
            <div className="text-text text-[18px] font-bold">
              {product?.name || "Untitled Product"}
            </div>
            <div className="flex justify-between items-center mt-1">
              <div className="underline text-[14px]">
                {product?.productId || "N/A"}
              </div>
              <div className="text-text text-[16px] font-semibold">
                ₹ {product?.price ?? "0.00"}
              </div>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="px-4 mt-3 flex-1 overflow-y-auto">
            <p className="text-[14px] text-justify leading-relaxed">
              {product?.description || "No description available."}
            </p>
          </div>

          {/* Drawer Actions */}
          {expanded && (canEdit || canArchive) && (
            <div className="px-4 pb-4 pt-4 flex justify-evenly">
              {canEdit && <VariantButton
                onClick={(event) => { event.stopPropagation(); handleEdit(event); }}
                variant="ghostCta"
                size="small"
                text="Edit"
                icon="pen"
              />}
              {canArchive && <VariantButton
                onClick={(event) => { event.stopPropagation(); handleDelete(event); }}
                variant="ghostRed"
                size="small"
                text="Delete"
                icon="trash-2"
              />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
