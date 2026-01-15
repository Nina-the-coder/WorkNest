const getNextSequence = require("../utils/getNextSequence");
const Customer = require("../models/Customer");

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
    console.error("Error in adding the customer...", err.message);
    res.status(500).json({ message: "SErver error" });
  }
};