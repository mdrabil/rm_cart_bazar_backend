import LanguagePreference from "../models/LanguagePreference.model.js";
import Customer from "../models/Customer.js";

export const getAdminLanguagePreferences = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const matchStage = {};

    const pipeline = [
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyDocuments: true } },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "customer.fullName": { $regex: search, $options: "i" } },
            { "customer.email": { $regex: search, $options: "i" } },
            { "customer.mobile": { $regex: search, $options: "i" } },
            { languageType: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await LanguagePreference.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    const summary = await LanguagePreference.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          englishUsers: {
            $sum: { $cond: [{ $eq: ["$languageType", "English"] }, 1, 0] },
          },
          hindiUsers: {
            $sum: { $cond: [{ $eq: ["$languageType", "Hindi"] }, 1, 0] },
          },
        },
      },
    ]);

    pipeline.push(
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          customerId: 1,
          languageType: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          customer: {
            _id: "$customer._id",
            fullName: "$customer.fullName",
            email: "$customer.email",
            mobile: "$customer.mobile",
            mrCustomerId: "$customer.mrCustomerId",
          },
        },
      }
    );

    const preferences = await LanguagePreference.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      preferences,
      total,
      summary: summary[0] || {
        totalUsers: 0,
        englishUsers: 0,
        hindiUsers: 0,
      },
    });
  } catch (err) {
    console.error("Admin language preferences list error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const toggleLanguagePreferenceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const preference = await LanguagePreference.findById(id).populate(
      "customerId",
      "fullName email mobile mrCustomerId"
    );

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: "Language preference not found",
      });
    }

    preference.status =
      preference.status === "active" ? "inactive" : "active";

    await preference.save();

    return res.status(200).json({
      success: true,
      message: `Language preference ${preference.status === "active" ? "activated" : "deactivated"}`,
      preference: {
        _id: preference._id,
        customerId: preference.customerId,
        languageType: preference.languageType,
        status: preference.status,
        customer: preference.customerId,
      },
    });
  } catch (err) {
    console.error("Toggle language preference status error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
