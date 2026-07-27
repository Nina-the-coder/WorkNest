import { useState } from "react";
import LabelInput from "./Labelnput";

const FileUpload = ({
  label = "Upload Image",
  accept = "image/*",
  onFileChange,
}) => {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    if (onFileChange) {
      onFileChange(file);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`cursor-pointer flex items-center justify-center
        w-[220px] h-[220px] border-2 border-dashed rounded-xl
        transition overflow-hidden
        ${dragActive ? "border-primary bg-bg" : "border-gray-400"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <label
          htmlFor="fileUpload"
          className="w-full h-full flex items-center justify-center"
        >
          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-secondary-text text-center">
              {label}
              <br />
              <span className="text-sm text-gray-400">
                Click or Drag Image
              </span>
            </span>
          )}
        </label>

        <input
          id="fileUpload"
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
      </div>

    </div>
  );
};

export default FileUpload;