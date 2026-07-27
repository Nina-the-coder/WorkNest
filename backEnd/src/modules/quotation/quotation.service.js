const quotationRepo = require("./quotation.repository");
const AppError = require("../../utils/AppError");

exports.getAllQuotations = async () => {
  return quotationRepo.findAllActive();
};

exports.updateQuotationStatus = async (quotationId, status) => {
  const quotation = await quotationRepo.findActiveByQuotationId(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  quotation.status = status;
  return quotationRepo.saveQuotation(quotation);
};

exports.deleteQuotation = async (quotationId) => {
  const quotation = await quotationRepo.findActiveByQuotationId(quotationId);

  if (!quotation) {
    throw new AppError("Quotation not found", 404);
  }

  quotation.deleted = true;
  quotation.deletedAt = new Date();

  return quotationRepo.saveQuotation(quotation);
};

// exports.getQuotationById = async (quotationId) => {
//   const quotation = await Quotation.findOne({ quotationId, deleted: false });
//   if (!quotation) {
//     throw new AppError("Quotation not found", 404);
//   }
//   return quotation;
// };


// exports.listQuotation = async () => {
//   const quotations = await Quotation.find({ deleted: false })
//     .populate("customerId", "name address contact email gst company")
//     .populate("products");
//   return quotations;
// };

// exports.getQuotationDetails = async (quotationId) => {
//   const quotation = await Quotation.findOne({ quotationId, deleted: false })
//     .populate("customerId", "name address contact email gst company")
//     .populate("products");
//   if (!quotation) {
//     throw new AppError("Quotation not found", 404);
//   }
//   return quotation;
// };

// exports.createQuotation = async (data, userId) => {
//   const { customerId, products } = data;

//   const newQuotationId = await getNextSequence("quotationId");

//   const newQuotation = new Quotation({
//     quotationId: newQuotationId,
//     customerId,
//     products,
//     addedBy: userId,
//     updatedBy: userId,
//   });

//   await newQuotation.save();
//   return newQuotation;
// };

// exports.updateQuotation = async (quotationId, data, userId) => {
//   const { customerId, products } = data;

//   const quotation = await Quotation.findOne({ quotationId, deleted: false });

//   if (!quotation) {
//     throw new AppError("Quotation not found", 404);
//   }

//   if (customerId) quotation.customerId = customerId;
//   if (products) quotation.products = products;

//   quotation.updatedBy = userId; // who updated
//   await quotation.save();
//   return quotation;
// };

// exports.fetchQuotations = async (req, res) => {
//   try {
//     const quotations = await Quotation.find({ deleted: false })
//       .populate({ path: "addedBy", select: "empId name" })
//       .populate({ path: "customerId", select: "customerId name" });
//     res.status(200).json(quotations);
//   } catch (err) {
//     console.error("Server errror", err);
//     res.status(500).json({
//       message: "SErver eror failed to fetch the quotations from the database",
//       error: err.message,
//     });
//   }
// };

// exports.getQuotationDetails = async (req, res) => {
//   try {
//     const { quotationId } = req.params;
//     const quotation = await Quotation.findOne({ quotationId, deleted: false })
//       .populate("customerId", "name address contact email gst company")
//       .populate("products");
//     if (!quotation) {
//       return res.status(404).json({ message: "Quotation not found" });
//     }
//     res.status(200).json(quotation);
//   } catch (err) {
//     console.error("Server error", err);
//     res.status(500).json({
//       message: "Server error failed to fetch the quotation details",
//       error: err.message,
//     });
//   }
// };

// exports.updateQuotationStatus = async (req, res) => {
//   try {
//     const { quotationId } = req.params;
//     const { status } = req.body;

//     const updatedQuotation = await Quotation.findOneAndUpdate(
//       { quotationId, deleted: false },
//       { status },
//       { new: true },
//     );

//     if (!updatedQuotation) {
//       return res.status(404).json({ message: "Quotation not found" });
//     }

//     res.status(200).json({
//       message: "updated quotation successfully",
//       quotation: updatedQuotation,
//     });
//   } catch (err) {
//     console.error("Server error", err);
//     res.status(500).json({
//       message: "Server error failed to update the status of the quotation",
//       error: err.message,
//     });
//   }
// };

// exports.deleteQuotation = async (req, res) => {
//   try {
//     const { quotationId } = req.params;

//     const quotation = await Quotation.findOne({ quotationId, deleted: false });

//     if (!quotation) {
//       return res.status(404).json({ message: "Quotation not found" });
//     }

//     quotation.deleted = true;
//     quotation.deletedAt = new Date();
//     await quotation.save();

//     res.status(200).json({
//       message: "quotation deleted successfully",
//     });
//   } catch (err) {
//     console.error("Server error", err);
//     res.status(500).json({
//       message: "Server error failed to delete the quotation",
//       error: err.message,
//     });
//   }
// };
