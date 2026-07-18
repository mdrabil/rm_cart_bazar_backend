// controllers/banner.controller.js
import Banner from "../models/Banner.model.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { generateMRId } from "../utils/mrId.js";

/* ================= CREATE ================= */
export const createBanner = async (req, res) => {
  try {
  const { text, platform } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image is required",
      });
    }

      const mrNo = await generateMRId("BNR", "BANNER");

      

 const banner = await Banner.create({
  text,
  mrNo,
 platform: Array.isArray(platform) ? platform : [platform || "WEB"],
  status: req.body.status || "ACTIVE",
  image: {
    url: req.file.path,
    public_id: req.file.filename,
  },
});

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error creating banner",
    });
  }
};

/* ================= GET ALL ================= */
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: banners,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching banners",
    });
  }
};


export const getAllBannersApp = async (req, res) => {
  try {
    const banners = await Banner.find({
    status: "ACTIVE",
    platform: "APP",
})
      .sort({ mrNo: 1 })
      .select("text mrNo date image.url status");

    const formatted = banners.map((b) => ({
      _id: b._id,
      text: b.text,
      mrNo: b.mrNo,
      status: b.status,
      date: b.date,
      image: {
        url: b.image?.url,
      },
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching banners",
    });
  }
};

export const getAllBannersWeb = async (req, res) => {
  try {
    const banners = await Banner.find({
      status: "ACTIVE",
      platform: "WEB",
    })
      .sort({ mrNo: 1 })
      .select("text mrNo date image.url status");

    res.json({
      success: true,
      data: banners,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching banners",
    });
  }
};
/* ================= GET SINGLE ================= */
export const getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.json({
      success: true,
      data: banner,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching banner",
    });
  }
};

/* ================= UPDATE ================= */
export const updateBanner = async (req, res) => {
  try {
   const { text, mrNo, platform } = req.body;

    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // update image if new uploaded
    if (req.file) {
      // delete old image from cloudinary
      await cloudinary.uploader.destroy(banner.image.public_id);

      banner.image = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    banner.text = text || banner.text;
    banner.mrNo = mrNo || banner.mrNo;
    banner.status = req.body.status || banner.status;
    banner.platform = Array.isArray(platform)
  ? platform
  : platform
  ? [platform]
  : banner.platform;

    await banner.save();

    res.json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating banner",
    });
  }
};

/* ================= DELETE ================= */
export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // delete image from cloudinary
    await cloudinary.uploader.destroy(banner.image.public_id);

    await banner.deleteOne();

    res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting banner",
    });
  }
};