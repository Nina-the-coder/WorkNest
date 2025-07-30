const Quotation = require("../../models/Quotation");

exports.getAllQuotations = async (req, res) => {
  try {
    const quotaton = await Quotation.find();
    res.status(200).json(quotation);
  } catch (err) {
    console.error("Server errror", err);
    res
      .status(500)
      .json({
        message: "SErver eror failed to fetch the quotations from the database",
        error: err.message,
      });
  }
};
