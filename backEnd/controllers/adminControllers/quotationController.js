const Quotation = require("../../models/Quotation");

exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate({ path: "addedBy", select: "empId name" })
      .populate({ path: "customerId", select: "customerId" });
    res.status(200).json(quotations);
  } catch (err) {
    console.error("Server errror", err);
    res.status(500).json({
      message: "SErver eror failed to fetch the quotations from the database",
      error: err.message,
    });
  }
};
