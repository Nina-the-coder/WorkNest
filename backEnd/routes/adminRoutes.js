const express = require('express')
const router = express.Router();
const {addEmployee, getAllEmployees} = require("../controllers/adminController");

router.post("/employees", addEmployee);
router.get("/employees", getAllEmployees);

module.exports = router;