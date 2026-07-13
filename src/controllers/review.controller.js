// import mongoose from "mongoose";
// import ProductModel from "../models/Product.model.js";
// import ReviewModel from "../models/Review.model.js";

// export const addReview = async (req, res) => {
//   try {
//     const { productId, rating, comment } = req.body;

//     const userId = req.user?._id; // 🔥 auth middleware se aayega

//     // ❌ validation
//     if (!productId || !rating) {
//       return res.status(400).json({
//         success: false,
//         message: "Product & rating are required",
//       });
//     }

//     // ❌ check product exist
//     const product = await ProductModel.findById(productId);
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     // ❌ already reviewed check
//     const existingReview = await ReviewModel.findOne({
//       product: productId,
//       user: userId,
//     });

//     if (existingReview) {
//       return res.status(400).json({
//         success: false,
//         message: "You already reviewed this product",
//       });
//     }

//     // ✅ create review
//     const newReview = await ReviewModel.create({
//       product: productId,
//       user: userId,
//       rating,
//       comment,
//     });

//     // ================= UPDATE PRODUCT RATING 🔥 =================
//     const reviews = await ReviewModel.find({ product: productId });

//     const totalReviews = reviews.length;

//     const avgRating =
//       reviews.reduce((acc, item) => acc + item.rating, 0) /
//       totalReviews;

//     await ProductModel.findByIdAndUpdate(productId, {
//       averageRating: avgRating.toFixed(1),
//       totalReviews,
//     });

//     // ================= RESPONSE =================
//     res.status(201).json({
//       success: true,
//       message: "Review added successfully",
//       review: newReview,
//     });

//   } catch (err) {
//     console.error("addReview error:", err);

//     // 🔥 duplicate key error (unique index)
//     if (err.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "You already reviewed this product",
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };



import mongoose from "mongoose";
import ProductModel from "../models/Product.model.js";
import ReviewModel from "../models/Review.model.js";

export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    const userId = req.user?._id; // 🔥 auth middleware se aayega

    // ❌ validation
    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Product & rating are required",
      });
    }

    // ❌ check product exist
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ❌ already reviewed check
    const existingReview = await ReviewModel.findOne({
      product: productId,
      user: userId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product",
      });
    }

    // ✅ create review
    const newReview = await ReviewModel.create({
      product: productId,
      user: userId,
      rating,
      comment,
    });

    // ================= UPDATE PRODUCT RATING 🔥 =================
    // const reviews = await ReviewModel.find({ product: productId });

    // const totalReviews = reviews.length;

    // const avgRating =
    //   reviews.reduce((acc, item) => acc + item.rating, 0) /
    //   totalReviews;

    // await ProductModel.findByIdAndUpdate(productId, {
    //   averageRating: avgRating.toFixed(1),
    //   totalReviews,
    // });


const newTotalReviews = product.totalReviews + 1;

// new average formula (no DB scan)
const newAverage =
  ((product.averageRating || 0) * product.totalReviews + rating) /
  newTotalReviews;

await ProductModel.findByIdAndUpdate(productId, {
  totalReviews: newTotalReviews,
  averageRating: Number(newAverage.toFixed(1)),
});

    // ================= RESPONSE =================
    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: newReview,
    });

  } catch (err) {
    console.error("addReview error:", err);

    // 🔥 duplicate key error (unique index)
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};