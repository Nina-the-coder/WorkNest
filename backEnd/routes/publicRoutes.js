const express = require("express");
const { addCustomer } = require("../controllers/generalControllers");

const router = express.Router();

router.post("/customers", addCustomer);


module.exports = router;