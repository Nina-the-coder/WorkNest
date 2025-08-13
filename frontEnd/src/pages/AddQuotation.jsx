import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import CustomerComboBox from "../components/CustomerComboBox";
import EmployeeComboBox from "../components/EmployeeComboBox";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
          const res = await axios.get(
            `${BASE_URL}/api/employee/customers/${existingQuotation.addedBy._id}`
          );
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
          const res = await axios.get(
            `${BASE_URL}/api/admin/employees/${existingQuotation.addedBy.empId}`
          );
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
      const res = await axios.get(`${BASE_URL}/api/admin/products`);
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
    if (selectedProducts.length === 0) {
      setError("Please add at least one product.");
      return;
    }
    if (user?.role === "admin" && !selectedEmployeeId) {
      setError("Please select an employee");
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
        await axios.put(
          `${BASE_URL}/api/employee/quotation/${existingQuotation.quotationId}`,
          finalQuotation,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // setQuotationFormData({});
        navigate(role === "admin" ? "/admin/quotations" : "/employee/dashboard");
      } catch (err) {
        setError(
          err?.response?.data?.message || "Error updating the quotation"
        );
      }
    } else {
      console.log("Final quotation being saved:", finalQuotation);
      try {
        const res = await axios.post(
          `${BASE_URL}/api/employee/quotation`,
          finalQuotation,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("Qutotation added to the db", res.data);
      } catch (err) {
        const message =
          err.response?.data?.message ||
          "An error occured while saving the quotation";
        setError(message);
      }
    }

    setError("");
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
    <div className="bg-slate-900 min-h-screen">
      <Navbar />
      {/* main */}
      <div className="flex justify-evenly">
        {/* quotation modal */}
        {quotationModal && (
          <div className="w-200 h-fit my-8 flex flex-col bg-slate-800 p-4">
            <div className="text-4xl text-white ml-28 my-4">Make Quotation</div>
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
                <div className="text-slate-300 mt-8">
                  <label htmlFor="Products" className="text-lg text-slate-200">
                    Add Products
                  </label>
                  <button
                    className="text-3xl font-extrabold py-0.5 px-4 ml-8 mb-4 bg-indigo-800 hover:bg-indigo-900 hover:cursor-pointer"
                    onClick={handleAddProductToQuotation}
                  >
                    +
                  </button>
                  {/* products list */}
                  {selectedProducts.length > 0 && (
                    <div className="">
                      <table className="bg-slate-300 text-slate-800 w-full">
                        <thead className="">
                          <tr>
                            <th className="w-20 p-0.5 border-r">Sr. no</th>
                            <th className="border-r">Product Name</th>
                            <th className="border-r">Price</th>
                            <th className="border-r">Quantity</th>
                          </tr>
                        </thead>
                        {selectedProducts.map((product, index) => (
                          <tbody key={product.productId} className="border">
                            <tr>
                              <td className="text-center border-r">
                                {index + 1}
                              </td>
                              <td className="border-r text-center">
                                {product.name}
                              </td>
                              <td className="border-r text-center">
                                {product.price}
                              </td>
                              <td className="flex justify-center">
                                <button
                                  className="py-0.5 px-2 my-2 text-lg text-white bg-indigo-800 hover:bg-indigo-900 hover:cursor-pointer"
                                  onClick={(e) =>
                                    decreaseProductQty(e, product.productId)
                                  }
                                >
                                  -
                                </button>
                                <div className="my-auto mx-2">
                                  {product.quantity}
                                </div>
                                <button
                                  className="py-0.5 px-2 my-2 text-lg text-white bg-indigo-800 hover:bg-indigo-900 hover:cursor-pointer"
                                  onClick={(e) =>
                                    increaseProductQty(e, product.productId)
                                  }
                                >
                                  +{" "}
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        ))}
                      </table>
                      <div className="w-full bg-slate-400 text-black text-right pr-24 mb-8">
                        Total - {quotationFormData.total}
                      </div>
                    </div>
                  )}
                </div>
                <label
                  htmlFor="isApprovedByDoctor"
                  className="text-lg text-slate-200"
                >
                  Doctor Approved
                </label>
                <select
                  name="isApprovedByDoctor"
                  id="isApprovedByDoctor"
                  onChange={handleChange}
                  value={quotationFormData.isApprovedByDoctor}
                  className="w-1/4 ml-2 mr-16 mt-4 p-0.5 bg-slate-200 border"
                >
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
                <label htmlFor="status" className="text-lg text-slate-200">
                  Status
                </label>
                <select
                  name="status"
                  id="status"
                  onChange={handleChange}
                  value={quotationFormData.status}
                  className="w-1/4 ml-2 mr-2 p-0.5 bg-slate-200 border"
                >
                  <option value="pending">pending</option>
                  <option value="approved">approved</option>
                  <option value="rejected">rejected</option>
                </select>
                {error && (
                  <div className="text-rose-500 mb-2 text-sm mt-4">{error}</div>
                )}
                <div className="flex justify-around items-center mt-4">
                  <Link
                    className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                    to={`${role === "employee" ? "/employee/dashboard": "/admin/quotations"}`}
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    onClick={handleSaveQuotationModal}
                    className="mt-8 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* product modal */}
        {productModal && (
          <div className="w-300 my-8 bg-slate-800 p-4">
            <div className="text-4xl text-white ml-28 mt-4">Add Products</div>
            <div>
              <div className="">
                <input
                  type="text"
                  className="h-8 w-150 bg-white my-8 ml-8 pl-2"
                  placeholder="Search Product by name, description"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* product container */}
              <div className="overflow-auto max-h-[400px] w-full pb-4 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => handleProductClick(product)}
                    className={`p-2 rounded-lg shadow-md flex flex-col h-[360px] cursor-pointer border-2 ${
                      selectedProducts.find(
                        (p) => p.productId === product.productId
                      )
                        ? "border-green-500 bg-slate-700"
                        : "border-transparent bg-slate-800"
                    }`}
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
                  </div>
                ))}
              </div>
            </div>
            {error && (
              <div className="text-rose-500 mb-2 text-sm mt-4">{error}</div>
            )}
            <div>
              <div className="flex justify-around items-center">
                <button
                  className="mt-4 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                  onClick={handleCancelProductModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSaveProductModal}
                  className="mt-4 p-2 px-10 hover:cursor-pointer bg-indigo-800 hover:bg-indigo-900 text-white"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddQuotation;
