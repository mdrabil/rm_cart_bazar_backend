import LanguagePreferenceModel from "../models/LanguagePreference.model.js";

const VALID_LANGUAGE_TYPES = ["English", "Hindi"];

export const getLanguagePreference = async (req, res) => {
  try {
    const customerId = req.user?._id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    let preference = await LanguagePreferenceModel.findOne({ customerId });

    if (!preference) {
      preference = await LanguagePreferenceModel.create({
        customerId,
        languageType: "English",
        status: "active",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        customerId: preference.customerId,
        languageType: preference.languageType,
        status: preference.status,
        canChangeLanguage: preference.status === "active",
      },
    });
  } catch (err) {
    console.error("Get language preference error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateLanguagePreference = async (req, res) => {
  try {
    const customerId = req.user?._id;
    const { languageType } = req.body;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!languageType || !VALID_LANGUAGE_TYPES.includes(languageType)) {
      return res.status(400).json({
        success: false,
        message: "languageType must be English or Hindi",
      });
    }

    const existing = await LanguagePreferenceModel.findOne({ customerId });

    if (existing?.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Language change is disabled by admin",
      });
    }

    const preference = await LanguagePreferenceModel.findOneAndUpdate(
      { customerId },
      {
        customerId,
        languageType,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Language preference updated",
      data: {
        customerId: preference.customerId,
        languageType: preference.languageType,
        status: preference.status,
        canChangeLanguage: preference.status === "active",
      },
    });
  } catch (err) {
    console.error("Update language preference error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getOrCreateLanguagePreference = async (customerId) => {
  let preference = await LanguagePreferenceModel.findOne({ customerId });

  if (!preference) {
    preference = await LanguagePreferenceModel.create({
      customerId,
      languageType: "English",
      status: "active",
    });
  }

  return preference;
};
