import LanguagePreference from "../../models/LanguagePreference.model.js";
import Customer from "../../models/Customer.js";

export const getAdminLanguagePreferences = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const { search, status, languageType } = req.query;

    const matchStage = {};

    if (status === "active" || status === "inactive") {
      matchStage.status = status;
    }

    if (languageType === "English" || languageType === "Hindi") {
      matchStage.languageType = languageType;
    }

    const pipeline = [
      { $match: matchStage },
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

    if (search?.trim()) {
      const regex = { $regex: search.trim(), $options: "i" };
      pipeline.push({
        $match: {
          $or: [
            { "customer.fullName": regex },
            { "customer.email": regex },
            { "customer.mobile": regex },
            { "customer.mrCustomerId": regex },
          ],
        },
      });
    }

    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await LanguagePreference.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    const dataPipeline = [
      ...pipeline,
      { $sort: { updatedAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
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
      },
    ];

    const preferences = await LanguagePreference.aggregate(dataPipeline);

    const [englishCount, hindiCount, totalUsers] = await Promise.all([
      LanguagePreference.countDocuments({ languageType: "English" }),
      LanguagePreference.countDocuments({ languageType: "Hindi" }),
      LanguagePreference.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        totalUsers,
        englishUsers: englishCount,
        hindiUsers: hindiCount,
      },
      total,
      page,
      limit,
      preferences,
    });
  } catch (err) {
    console.error("Admin get language preferences error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const toggleLanguagePreferenceStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const preference = await LanguagePreference.findById(id);

    if (!preference) {
      return res.status(404).json({
        success: false,
        message: "Language preference not found",
      });
    }

    preference.status = preference.status === "active" ? "inactive" : "active";
    await preference.save();

    const customer = await Customer.findById(preference.customerId).select(
      "fullName email mobile mrCustomerId"
    );

    return res.status(200).json({
      success: true,
      message: `Language preference marked as ${preference.status}`,
      data: {
        _id: preference._id,
        customerId: preference.customerId,
        languageType: preference.languageType,
        status: preference.status,
        customer,
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
