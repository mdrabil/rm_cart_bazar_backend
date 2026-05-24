import { SIDEBAR_COUNT_CONFIG } from "../utils/sidebarCountConfig.js";

export const getSidebarCounts = async (req, res) => {
  try {
    const entries = Object.entries(SIDEBAR_COUNT_CONFIG);

    const countPromises = entries.map(async ([key, value]) => {
      const total = await value.model.countDocuments(value.filter || {});

      return [key, total];
    });

    const resolved = await Promise.all(countPromises);

    const counts = Object.fromEntries(resolved);

    return res.status(200).json({
      success: true,
      counts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};