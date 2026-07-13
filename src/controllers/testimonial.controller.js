import cloudinary from "../config/cloudinaryConfig.js";
import Testimonial from "../models/Testimonial.model.js";

import { generateMRId } from "../utils/mrId.js";

// CREATE TESTIMONIAL

// CREATE TESTIMONIAL
export const createTestimonial = async (req, res) => {
  let uploadedImage = null; // for rollback in case of validation error

  try {
    // 1️⃣ Check if user is logged in
    if (!req.user)
      return res.status(401).json({ success: false, message: "User not logged in" });

    const { name, profession, message, rating } = req.body;

    // 2️⃣ Validate required fields
    if (!name || !profession || !message || !rating || !req.file) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, profession, message, rating, image) are required",
      });
    }

    // 3️⃣ Validate message length
    if (message.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 10 characters long",
      });
    }

    // 4️⃣ Validate rating
    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    // 5️⃣ Upload image to Cloudinary
    uploadedImage = await cloudinary.uploader.upload(req.file.path, { folder: "testimonials" });

    // 6️⃣ Generate unique MR ID
    const mrTestimonialId = await generateMRId("TSMN", "TESTIMONIAL");

    // 7️⃣ Create testimonial in MongoDB
    const testimonial = await Testimonial.create({
      mrTestimonialId,
      user: req.user._id,
      name: name.trim(),
      profession: profession.trim(),
      message: message.trim(),
      rating: numericRating,
      image: {
        public_id: uploadedImage.public_id,
        url: uploadedImage.secure_url,
      },
    });

    return res.status(201).json({ success: true, data: testimonial });
  } catch (error) {
    // 8️⃣ Rollback uploaded image if testimonial creation failed
    if (uploadedImage?.public_id) {
      await cloudinary.uploader.destroy(uploadedImage.public_id);
    }

    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// GET ALL TESTIMONIALS WITH FILTER + PAGINATION
export const getTestimonials = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status, isApproved, startDate, endDate } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const match = {};

    if (search) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { profession: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    if (status) match.status = status;
    if (isApproved !== undefined) match.isApproved = isApproved === "true";

    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const total = await Testimonial.countDocuments(match);

    const testimonials = await Testimonial.find(match)
      .populate("user")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: testimonials, total, page, limit });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


export const getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true })
      .populate("user", "fullName") // optional: populate user info if needed
      .sort({ createdAt: -1 }); // latest first

      // console.log("get testi",testimonials)

    return res.status(200).json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    });
  } catch (error) {
    console.error("Error fetching approved testimonials:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: Unable to fetch testimonials",
    });
  }
};

// UPDATE TESTIMONIAL DETAILS
export const updateTestimonial = async (req, res) => {
  try {
    // 1️⃣ Check if user is logged in
    if (!req.user)
      return res.status(401).json({ success: false, message: "User not logged in" });

    const { id } = req.params;
    const { name, profession, message, rating, isApproved, status } = req.body;

    console.log("Received data:", req.body);

    // 2️⃣ Find the testimonial
    const testimonial = await Testimonial.findById(id);
    if (!testimonial)
      return res.status(404).json({ success: false, message: "Testimonial not found" });

    // 3️⃣ Validate and update name, profession, message
    if (name && name.trim().length >= 2) testimonial.name = name.trim();
    if (profession && profession.trim().length >= 2) testimonial.profession = profession.trim();
    if (message && message.trim().length >= 10) testimonial.message = message.trim();

    // 4️⃣ Validate and update rating
    if (rating) {
      const numericRating = Number(rating);
      if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be 1-5" });
      }
      testimonial.rating = numericRating;
    }

    // 5️⃣ Update isApproved
    if (typeof isApproved !== "undefined") {
      testimonial.isApproved = isApproved === "true" || isApproved === true;
    }

    // 6️⃣ Update status (active/inactive)
    if (status) {
      const validStatus = ["active", "inactive"];
      if (!validStatus.includes(status.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Status must be active or inactive" });
      }
      testimonial.status = status.toLowerCase();
    }

    // 7️⃣ Update image if uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (testimonial.image?.public_id) {
        await cloudinary.uploader.destroy(testimonial.image.public_id);
      }
      const result = await cloudinary.uploader.upload(req.file.path, { folder: "testimonials" });
      testimonial.image = { public_id: result.public_id, url: result.secure_url };
    }

    // 8️⃣ Save the testimonial
    await testimonial.save();

    return res.json({ success: true, data: testimonial });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// UPDATE APPROVE STATUS
export const updateTestimonialStatus = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "User not logged in" });

    const { id } = req.params;
    const { isApproved } = req.body;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) return res.status(404).json({ success: false, message: "Testimonial not found" });

    testimonial.isApproved = isApproved;
    await testimonial.save();

    res.json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// DELETE TESTIMONIAL
// export const deleteTestimonial = async (req, res) => {
//   try {
//     if (!req.user)
//       return res.status(401).json({ success: false, message: "User not logged in" });

//     const { id } = req.params;
//     const testimonial = await Testimonial.findById(id);
//     if (!testimonial) return res.status(404).json({ success: false, message: "Testimonial not found" });

//     await cloudinary.uploader.destroy(testimonial.image.public_id);
//     await testimonial.remove();

//     res.json({ success: true, message: "Testimonial deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "Server Error", error: error.message });
//   }
// };


export const deleteTestimonial = async (req, res) => {
  try {
    if (!req.user)
      return res.status(401).json({ success: false, message: "User not logged in" });

    const { id } = req.params;

    // Find and delete testimonial
    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial)
      return res.status(404).json({ success: false, message: "Testimonial not found" });

    // Delete image from Cloudinary if exists
    if (testimonial.image && testimonial.image.public_id) {
      await cloudinary.uploader.destroy(testimonial.image.public_id);
    }

    res.json({ success: true, message: "Testimonial deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};