const Customer = require("../../models/Customer");
const getNextSequence = require("../../utils/getNextSequence");

exports.addCustomer = async (req, res) => {
  try {
    const { name, address, contact, gst, email, status, companyType, addedBy } =
      req.body;

    const nextCustomerNumber = await getNextSequence("customerId");
    const CustomerId = `CUST${String(nextCustomerNumber).padStart(3, "0")}`;

    const newCustomer = new Customer({
      customerId: CustomerId,
      name,
      address,
      contact,
      gst,
      email,
      status,
      companyType,
      addedBy,
    });

    await newCustomer.save();
    res
      .status(201)
      .json({ message: "Customer added successfully", customer: newCustomer });
  } catch (err) {
    console.error("Error in adding the customer...", err);
    res.status(500).json({ message: "SErver error" });
  }
};

exports.getAllCustomers = async (req, res) => {
  try {
    const customer = await Customer.find().select();
    res.status(200).json(customer);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch customers", error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const deleted = await Customer.deleteOne({ customerId });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in deleting the Customer", error: err.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { name, address, contact, gst, email, status, companyType, addedBy } =
      req.body;

    const updatedData = {
      name,
      address,
      contact,
      gst,
      email,
      status,
      companyType,
      addedBy,
    };

    const updatedcustomer = await Customer.findOneAndUpdate(
      { customerId },
      updatedData,
      {
        new: true,
      }
    );
    res
      .status(200)
      .json({ message: "customer Updated", customer: updatedcustomer });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error in updating the customer", error: err.message });
  }
};
