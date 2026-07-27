// modules/product/components/ProductModal.jsx
import VariantButton from "../../../shared/components/buttons/VariantButton";
import FileUpload from "../../../shared/components/FileUpload";
import LabelInput from "../../../shared/components/Labelnput";

const ProductModal = ({
  formData,
  setFormData,
  handleChange,
  handleSave,
  handleCancel,
  isEdit,
}) => {
  return (
    <div className="w-fit rounded-2xl mx-auto mt-16 p-8 bg-card-bg">
      <div className="text-[20px] flex justify-center mb-8">
        {isEdit ? "Edit Product" : "Add New Product"}
      </div>

      <form className="flex flex-col gap-4">
        <LabelInput
          labelName={"Name"}
          name="name"
          value={formData.name}
          onChange={handleChange}
        />

        <div className="flex flex-col w-full">
          <label className="ml-2 mb-0.5 text-secondary-text">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full h-[80px] bg-bg rounded-xl px-2"
          />
        </div>

        <label className="ml-2 text-secondary-text">Product Image</label>
        <FileUpload
          label="Upload Product Image"
          onFileChange={(file) => {
            setFormData((prev) => ({
              ...prev,
              image: file,
            }));
          }}
        />

        <LabelInput
          inputType="number"
          labelName={"Price"}
          name="price"
          value={formData.price}
          onChange={handleChange}
        />

        <div className="flex gap-6 mx-auto mt-8">
          <VariantButton
            onClick={handleCancel}
            variant="ghostRed"
            size="medium"
            text="Cancel"
          />
          <VariantButton
            onClick={handleSave}
            variant="cta"
            size="medium"
            text="Save"
          />
        </div>
      </form>
    </div>
  );
};

export default ProductModal;
