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

exports.listQuotation = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      sort = "-createdAt",
      status,
    } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const pipeline = [];

    if (status) {
      pipeline.push({ $match: { status } });
    }

    // join customer
    pipeline.push({
      $lookup: {
        from: "customers", // actual Mongo collection name
        localField: "customerId",
        foreignField: "_id",
        as: "customerId",
      },
    });
    pipeline.push({ $unwind: "$customerId" });

    // join addedBy
    pipeline.push({
      $lookup: {
        from: "users", // or "users"
        localField: "addedBy",
        foreignField: "_id",
        as: "addedBy",
      },
    });
    pipeline.push({ $unwind: "$addedBy" });

    if (search && search.trim()) {
      const s = search.trim();
      pipeline.push({
        $match: {
          $or: [
            { quotationId: { $regex: s, $options: "i" } },
            { "customerId.customerId": { $regex: s, $options: "i" } },
            { "customerId.name": { $regex: s, $options: "i" } },
            { "addedBy.empId": { $regex: s, $options: "i" } },
            { "addedBy.name": { $regex: s, $options: "i" } },
          ],
        },
      });
    }

    // total count before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const totalDocs = await Quotation.aggregate(countPipeline);
    const total = totalDocs[0]?.total || 0;

    // sort + paginate
    const sortObj = {};
    const sortField = sort.replace("-", "");
    sortObj[sortField] = sort.startsWith("-") ? -1 : 1;

    pipeline.push({ $sort: sortObj });
    pipeline.push({ $skip: (page - 1) * limit });
    pipeline.push({ $limit: limit });

    // final projection
    pipeline.push({
      $project: {
        quotationId: 1,
        status: 1,
        total: 1,
        isApprovedByDoctor: 1,
        createdAt: 1,
        products: 1,
        "customerId.customerId": 1,
        "customerId.name": 1,
        "addedBy.empId": 1,
        "addedBy.name": 1,
      },
    });

    const items = await Quotation.aggregate(pipeline);

    res.json({
      quotations: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("Server error", err);
    res.status(500).json({
      message: "Server error failed to fetch the quotations from the database",
      error: err.message,
    });
  }
};
