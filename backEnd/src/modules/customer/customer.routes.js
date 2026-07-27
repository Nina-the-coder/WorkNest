const CustomerController = require("./customer.controller");
const express = require("express");
const router = express.Router();

// customer routes
// router.post("/customers", CustomerController.addCustomer);         //  --> now a public route
router.get("/", CustomerController.getAllCustomers);
router.delete("/:customerId", CustomerController.deleteCustomer);
router.put("/:customerId", CustomerController.updateCustomer);

module.exports = router;
