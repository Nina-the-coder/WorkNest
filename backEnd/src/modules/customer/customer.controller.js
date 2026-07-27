const CustomerService = require("./customer.service");

exports.getAllCustomers = async (req, res) => {
  const customers = await CustomerService.getAllCustomers();
  res.status(200).json(customers);
};

exports.deleteCustomer = async (req, res) => {
  await CustomerService.deleteCustomer(req.params.customerId, req.user._id);
  res.status(200).json({ message: "Customer deleted successfully" });
};

exports.updateCustomer = async (req, res) => {
  const updatedCustomer = await CustomerService.updateCustomer(
    req.params.customerId,
    req.body,
    req.user._id
  );
  res.status(200).json({ message: "Customer updated successfully", customer: updatedCustomer });
};


// exports.addCustomer = async (req, res) => {
//   try {
//     const { name, address, contact, gst, email, status, companyType, addedBy } =
//       req.body;

//     const nextCustomerNumber = await getNextSequence("customerId");
//     const CustomerId = `CUST${String(nextCustomerNumber).padStart(3, "0")}`;

//     const newCustomer = new Customer({
//       customerId: CustomerId,
//       name,
//       address,
//       contact,
//       gst,
//       email,
//       status,
//       companyType,
//       addedBy,
//     });

//     await newCustomer.save();
//     res
//       .status(201)
//       .json({ message: "Customer added successfully", customer: newCustomer });
//   } catch (err) {
//     console.error("Error in adding the customer...", err);
//     res.status(500).json({ message: "SErver error" });
//   }
// };


