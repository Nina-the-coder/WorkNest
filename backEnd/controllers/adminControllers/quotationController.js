const Quotation = require("../../models/Quotation");

exports.getAllQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find({ deleted: false })
      .populate({ path: "addedBy", select: "empId name" })
      .populate({ path: "customerId", select: "customerId name" });
    res.status(200).json(quotations);
  } catch (err) {
    console.error("Server errror", err);
    res.status(500).json({
      message: "SErver eror failed to fetch the quotations from the database",
      error: err.message,
    });
  }
};

exports.updateQuotationStatus = async (req, res) => {
  try {
    const { quotationId } = req.params;
    const { status } = req.body;

    const updatedQuotation = await Quotation.findOneAndUpdate(
      { quotationId },
      { status },
      { new: true }
    );

    if (!updatedQuotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    res.status(200).json({
      message: "updated quotation successfully",
      quotation: updatedQuotation,
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error failed to update the status of the quotation",
      error: err.message,
    });
  }
};

exports.deleteQuotation = async (req, res) => {
  try {
    const { quotationId } = req.params;

    const quotation = await Quotation.findOne({ quotationId });

    if (!quotation) {
      res.status(404).json({ message: "Quotation not found" });
    }

    quotation.deleted = true;
    quotation.deletedAt = new Date();

    await quotation.save();

    res.status(200).json({
      message: "quotation deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error failed to delete the quotation",
      error: err.message,
    });
  }
};
