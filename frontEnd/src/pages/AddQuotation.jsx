import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import CustomerComboBox from "../components/combobox/CustomerComboBox";
import EmployeeComboBox from "../components/combobox/EmployeeComboBox";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "../components/buttons/ThemeToggle";
import VariantButton from "../components/buttons/VariantButton";
import SearchBar from "../components/SearchBar";
import { toast } from "react-toastify";
import api from "../api/axios";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const AddQuotation = (props) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = props.role || user?.role;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState("");
  // const [employeeList, setEmployeeList] = useState([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedEmployeeObj, setSelectedEmployeeObj] = useState(null);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState(null);

  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const isEditMode = location.state?.mode === "edit";
  const existingQuotation = location.state?.quotation;

  const [quotationModal, setQuotationModal] = useState(true);
  const [productModal, setProductModal] = useState(false);

  const [quotationFormData, setQuotationFormData] = useState({
    addedBy: role === "admin" ? "" : user?.empId,
    customerId: "",
    total: 0,
    products: [], // [{productId, productName, quotedPrice, total}]
    isApprovedByDoctor: "pending",
    status: "pending",
  });

  useEffect(() => {
    if (role === "employee") {
      setQuotationFormData((prev) => ({
        ...prev,
        addedBy: user.empId,
      }));
    }
    // if (role === "admin") {
    //   const fetchEmployees = async () => {
    //     try {
    //       const res = await axios.get(`${BASE_URL}/api/admin/employees`, {
    //         headers: { Authorization: `Bearer ${token}` },
    //       });
    //       setEmployeeList(res.data);
    //     } catch (err) {
    //       console.error("Error fetching employees:", err);
    //     }
    //   };
    //   fetchEmployees();
    // }
  }, []);

  useEffect(() => {
    updateTotalPrice();
  }, [selectedProducts]);

  useEffect(() => {
    if (isEditMode && existingQuotation) {
      console.log("yes it is the edit mode");
      // Pre-fill the form
      setQuotationFormData(existingQuotation);
      setSelectedProducts(existingQuotation.products);

      const fetchCustomerById = async () => {
        try {
          const res = await api.get(`${BASE_URL}/api/employee/customers/${existingQuotation.addedBy._id}`);
          setSelectedCustomerObj(res.data); // ✅ pass the whole object
          // console.log("fetched customer from db", res.data);
        } catch (err) {
          console.error("Error fetching customer:", err);
        }
      };

      fetchCustomerById();

      const fetchEmployeeById = async () => {
        try {
          // console.log("existing quotation :", existingQuotation);
          const res = await api.get(`${BASE_URL}/api/admin/employees/${existingQuotation.addedBy.empId}`);
          setSelectedEmployeeObj(res.data); // ✅ set full employee object
          setSelectedEmployeeId(res.data._id); // ✅ set ID for form
          // console.log("fetched employee from db", res.data);
        } catch (err) {
          console.error("Error fetching employee:", err);
        }
      };

      if (role === "admin") {
        fetchEmployeeById();
      }
    }
  }, [isEditMode, existingQuotation]);

  const handleChange = (e) => {
    setQuotationFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get(`${BASE_URL}/api/admin/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Error in fetching the products form the database...", err);
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomerObj(customer); // whole object
    setQuotationFormData((prev) => ({
      ...prev,
      customerId: customer._id, // only ID goes into the form
    }));
  };

  const handleSaveQuotationModal = async (e) => {
    e.preventDefault();
    if (user?.role === "admin" && !selectedEmployeeId) {
      toast.warn("Please select an employee");
      return;
    }
    if (!selectedCustomerObj) {
      toast.warn("Please select a customer");
      return;
    }
    if (selectedProducts.length === 0) {
      toast.warn("Please add at least one product.");
      return;
    }

    setQuotationFormData((prev) => ({
      ...prev,
      products: selectedProducts,
      addedBy: user.role === "admin" ? selectedEmployeeId : user.empId,
    }));

    const finalQuotation = {
      ...quotationFormData,
      products: selectedProducts,
      addedBy: role === "admin" ? selectedEmployeeId : user.empId,
    };

    if (isEditMode) {
      try {
        await api.put(`${BASE_URL}/api/employee/quotation/${existingQuotation.quotationId}`,finalQuotation,);
        // setQuotationFormData({});
        navigate(
          role === "admin" ? "/admin/quotations" : "/employee/dashboard"
        );
        toast.success("Quotation updated successfully");
      } catch (err) {
        toast.error(
          err?.response?.data?.message || "Error updating the quotation"
        );
        console.error(
          err?.response?.data?.message || "Error updating the quotation"
        );
      }
    } else {
      console.log("Final quotation being saved:", finalQuotation);
      try {
        const res = await api.post(`${BASE_URL}/api/employee/quotation`,finalQuotation,);
        toast.success("Quotation saved successfully");
      } catch (err) {
        const message =
          err.response?.data?.message ||
          "An error occured while saving the quotation";
        toast.error(message);
      }
    }

    navigate(role === "admin" ? "/admin/quotations" : "/employee/dashboard");
  };

  const handleAddProductToQuotation = () => {
    fetchProducts();
    setProductModal(true);
    setQuotationModal(false);
  };

  const handleCancelProductModal = () => {
    setProductModal(false);
    setQuotationModal(true);
  };

  const handleSaveProductModal = (e) => {
    e.preventDefault();
    setProductModal(false);
    setQuotationModal(true);
    updateTotalPrice();
  };

  const handleProductClick = (product) => {
    const alreadySelected = selectedProducts.find(
      (p) => p.productId === product.productId || p.productId === product._id
    );
    if (alreadySelected) {
      setSelectedProducts((prev) =>
        // remove
        prev.filter((p) => p.productId !== product.productId)
      );
    } else {
      // add
      setSelectedProducts((prev) => [
        ...prev,
        {
          productId: product.productId || product._id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const increaseProductQty = (e, productId) => {
    e.preventDefault();
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? { ...p, quantity: (p.quantity || 0) + 1 }
          : p
      )
    );
  };

  const decreaseProductQty = (e, productId) => {
    e.preventDefault();
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? { ...p, quantity: p.quantity > 1 ? p.quantity - 1 : p.quantity }
          : p
      )
    );
  };

  const updateTotalPrice = () => {
    let sum = 0;
    selectedProducts.forEach((product) => {
      sum += product.price * product.quantity;
    });
    setQuotationFormData((prev) => ({ ...prev, total: sum }));
  };

  const filteredProducts = products.filter((product) => {
    const matchesProduct =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.productId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesProduct;
  });

  return (
    <div className="bg-bg min-h-screen w-full">
      {/* main */}
      <div className="w-full flex justify-end p-4">
        <ThemeToggle></ThemeToggle>
      </div>
      <div className="flex justify-evenly">
        {/* quotation modal */}
        {quotationModal && (
          <div className="h-fit flex flex-col bg-card-bg bg-gradient-to-r from-bg/80 to-card-bg/0 transition-all duration-300 p-8 rounded-2xl">
            <div className="text-[20px] font-bold flex items-center justify-center mb-8 ml-4 text-text">
              Make Quotation
            </div>
            <div>
              <form className="mx-4 pt-8">
                {role === "admin" && (
                  <div className="mb-4">
                    <EmployeeComboBox
                      onSelect={(emp) => setSelectedEmployeeId(emp._id)}
                      selected={selectedEmployeeObj}
                    />
                  </div>
                )}

                {(!isEditMode || role === "admin") && (
                  <CustomerComboBox
                    user={user}
                    onSelect={handleCustomerSelect}
                    selectedCustomer={selectedCustomerObj}
                  />
                )}

                {/* products */}
                <div className="text-text/90 mt-8 flex-col items-center">
                  <div className="flex items-center mb-4">
                    <label
                      htmlFor="Products"
                      className="text-[18px] ml-4 text-text/90"
                    >
                      Add Products
                    </label>
                    <VariantButton
                      onClick={handleAddProductToQuotation}
                      variant="cta"
                      icon="plus"
                      size="tiny"
                      className="h-[32px] w-[35px] inline-flex ml-4"
                    />
                  </div>

                  {/* products list */}
                  {selectedProducts.length > 0 && (
                    <div className="mt-8">
                      <table className="text-text w-full">
                        <thead className="bg-card-bg border-b border-t border-l border-r">
                          <tr>
                            <th className="w-[50px] p-0.5 border">S. no.</th>
                            <th className="min-w-[200px] border px-1">
                              Product Name
                            </th>
                            <th className="border w-[100px]">Price</th>
                            <th className="border px-8">Quantity</th>
                          </tr>
                        </thead>
                        {selectedProducts.map((product, index) => (
                          <tbody
                            key={product.productId}
                            className="border bg-bg"
                          >
                            <tr>
                              <td className="text-center border h-[40px]">
                                {index + 1}
                              </td>
                              <td className="border text-center">
                                {product.name}
                              </td>
                              <td className="border text-center">
                                {product.price}
                              </td>
                              <td className="flex pt-2 gap-0.5 justify-center items-center">
                                <VariantButton
                                  size="tiny"
                                  variant="ghostRed"
                                  text=""
                                  icon="minus"
                                  className="max-h-[24px] max-w-[24px]"
                                  onClick={(e) =>
                                    decreaseProductQty(e, product.productId)
                                  }
                                ></VariantButton>
                                <div className="mx-2">{product.quantity}</div>
                                <VariantButton
                                  size="tiny"
                                  variant="ghostCta"
                                  text=""
                                  icon="plus"
                                  className="max-h-[24px] max-w-[24px]"
                                  onClick={(e) =>
                                    increaseProductQty(e, product.productId)
                                  }
                                ></VariantButton>
                              </td>
                            </tr>
                          </tbody>
                        ))}
                      </table>
                      <div className="w-full border-r border-b border-l py-2 text-[18px] bg-card-bg text-text font-semibold text-right pr-24 mb-8">
                        Total - {quotationFormData.total}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-around gap-8 mt-8">
                  <div className="flex flex-col">
                    <label
                      htmlFor="isApprovedByDoctor"
                      className="w-full text-[16px] ml-4 text-text/90"
                    >
                      Doctor Approved
                    </label>
                    <select
                      name="isApprovedByDoctor"
                      id="isApprovedByDoctor"
                      onChange={handleChange}
                      value={quotationFormData.isApprovedByDoctor}
                      className="w-[160px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                    >
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label
                      htmlFor="status"
                      className="w-full text-[16px] ml-4 text-text/90"
                    >
                      Status
                    </label>
                    <select
                      name="status"
                      id="status"
                      onChange={handleChange}
                      value={quotationFormData.status}
                      className="w-[160px] h-[28px] p-0.5 rounded-xl mb-4 bg-white"
                    >
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-around items-center mt-8">
                  <Link
                    to={`${
                      role === "employee"
                        ? "/employee/dashboard"
                        : "/admin/quotations"
                    }`}
                  >
                    <VariantButton
                      variant="ghostRed"
                      text="Cancel"
                      icon="x"
                      size="medium"
                    ></VariantButton>
                  </Link>
                  <VariantButton
                    onClick={handleSaveQuotationModal}
                    variant="cta"
                    text={isEditMode ? "Update" : "Save"}
                    icon="check"
                    size="medium"
                  ></VariantButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* product modal */}
        {productModal && (
          <div className="mx-8 lg:w-[1300px]  flex flex-col bg-card-bg bg-gradient-to-r from-bg/80 to-card-bg/0 transition-all duration-300 p-8 rounded-2xl">
            <div className="text-[20px] text-text font-bold text-center mt-4">
              Add Products
            </div>
            <div>
              <div className="m-8">
                <SearchBar
                  placeholder="Search Product by name, description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* product container */}
              <div
                className="overflow-auto max-h-[400px] w-full pb-4 px-4
              flex flex-wrap gap-4"
              >
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => handleProductClick(product)}
                    className={`rounded-2xl shadow-md flex flex-col h-[360px] w-[280px] cursor-pointer border-2 ${
                      selectedProducts.find(
                        (p) => p.productId === product.productId
                      )
                        ? "border-cta/50 bg-card-bg"
                        : "border-transparent bg-bg"
                    }`}
                  >
                    <div className="p-2">
                      {/* Image */}
                      <div className="w-full h-[180px] rounded-2xl overflow-hidden mb-3 flex items-center justify-center">
                        <img
                          src={`${BASE_URL}/uploads/${product.image}`}
                          alt={product.name}
                          className="w-full h-full object-fill"
                        />
                      </div>
                      {/* Title */}
                      <div className="ml-4 mb-0.5 text-text text-[16px] font-semibold truncate">
                        {product.name}
                      </div>
                      {/* ID & Price */}
                      <div className="mx-2 flex justify-between text-secondary-text text-[14px] mb-2">
                        <div>{product.productId}</div>
                        <div className="text-text text-[16px] font-semibold">
                          ₹ {product.price}
                        </div>
                      </div>
                      {/* Description */}
                      <div className="mx-2 text-secondary-text h-[80px] text-sm line-clamp-4 text-justify">
                        {product.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {error && (
              <div className="text-rose-500 mb-2 text-sm mt-4">{error}</div>
            )}
            <div>
              <div className="flex justify-center gap-16 pt-8 items-center">
                <VariantButton
                  onClick={handleCancelProductModal}
                  variant="ghostRed"
                  text="Cancel"
                  icon="x"
                  size="large"
                  className={"justify-center gap-4"}
                ></VariantButton>
                <VariantButton
                  onClick={handleSaveProductModal}
                  variant="cta"
                  text="Save"
                  icon="check"
                  size="large"
                  className={"justify-center gap-4"}
                ></VariantButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddQuotation;
