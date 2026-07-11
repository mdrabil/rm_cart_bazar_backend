import mongoose from "mongoose";
import CategoryModel from "../../models/Category.model.js";
import CouponModel from "../../models/Coupon.model.js";
import CouponUsageModel from "../../models/CouponUsage.model.js";
import ProductModel from "../../models/Product.model.js";
import ReviewModel from "../../models/Review.model.js";



// 🔹 GET PRODUCT BY ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await ProductModel.findById(productId).populate('category').populate("subCategory").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });


    res.json({ success: true, product });
  } catch (err) {
    console.error("getProductById:", err);
    res.status(500).json({ message: "Server error" });
  }
};





// export const getAllCategorys = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, name, search } = req.query;

//     const pageNum = Number(page);
//     const limitNum = Number(limit);

//     let filter = {};

//     if (name) filter.name = { $regex: name, $options: "i" };

//     if (search) {
//       filter.$or = [{ name: { $regex: search, $options: "i" } }];
//     }

//     const total = await CategoryModel.countDocuments(filter);

//  const categoryData = await CategoryModel.find(filter)
//   .populate("parentCategory", "name")
//   .skip((pageNum - 1) * limitNum)
//   .limit(limitNum)
//   .sort({ createdAt: -1 });

// const category = categoryData.map((cat) => ({
//   _id: cat._id,
//   name: cat.name,
//   status: cat.status,
//   parentCategory: cat.parentCategory,
//   image: cat.image?.url || null,   // ✅ only url
//   createdAt: cat.createdAt,
// }));

//     res.status(200).json({
//       total,
//       success:true,
//       page: pageNum,
//       limit: limitNum,
//       category,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
export const getAllCategorys = async (req, res) => {
  try {
    const { page = 1, limit = 20, name, search } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    let filter = {};

    // 🔍 search filters
    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } }
      ];
    }

    // 🚀 FAST QUERY
    const categoryData = await CategoryModel.find(filter)
      .select("name status parentCategory image createdAt") // only needed fields
      .populate("parentCategory", "name") // remove if not needed
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(); // 🔥 MUST for speed

    // 🎯 clean response
    const category = categoryData.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      status: cat.status,
      parentCategory: cat.parentCategory,
      image: cat.image?.url || null,
      createdAt: cat.createdAt,
    }));

    res.status(200).json({
      success: true,
      page: pageNum,
      limit: limitNum,
      category,
      hasNextPage: category.length === limitNum, // 🔥 no countDocuments
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// export const getAllProducts = async (req, res) => {
//   try {
   
//     const {
//       page = 1,
//       limit = 20,
//       store,
//       category,
//       status,
//       name,
//       search
//     } = req.body;



//     let filter = {};

     
   
  

//     // ================= Optional filters =================
//     if (store) filter.store = store; // optional override for super admin
//     if (category) filter.category = category;
//     if (status) filter.status = status;
//     if (name) filter.name = { $regex: name, $options: "i" };

//     // ================= Search across name & description =================
//     if (search) {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // ================= Total count =================
//     const total = await ProductModel.countDocuments(filter);

//     // ================= Products with pagination & populate =================
//   const productData = await ProductModel.find(filter)
//   .populate("category", "name")
//   .populate("subCategory", "name")
//   .skip((page - 1) * limit)
//   .limit(limit)
//   .sort({ createdAt: -1 });

// const products = productData.map((p) => ({
//   _id: p._id,
//   mrProductId: p.mrProductId,
//   name: p.name,
//   description: p.description,
//   category: p.category,
//   label: p.label,
//   subCategory: p.subCategory,
//   variants: p.variants,
//   gstPercent: p.gstPercent,
//   status: p.status,
//   images: p.images?.map((img) => img.url), // ✅ only url
//   thumbnails: p.thumbnails?.map((img) => img.url), // ✅ only url
//   createdAt: p.createdAt,
// }));

//     // ================= Response =================
//     res.status(200).json({
//       success: true,
//       message: "Products fetched successfully",
//       total,
//       page,
//       limit,
//       products
//     });

//   } catch (err) {
//     console.error("getAllProducts error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again later."
//     });
//   }
// };



// export const getAllProducts = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       store,
//       category,
//       status,
//       name,
//       search
//     } = req.query;

//     const pageNumber = Number(page);
//     const limitNumber = Number(limit);

//     let filter = {};

//     // ================= FILTERS =================
//     if (store) {
//       filter.store = new mongoose.Types.ObjectId(store);
//     }

//     if (status) {
//       filter.status = status;
//     }

//     if (name) {
//       filter.name = { $regex: name, $options: "i" };
//     }

//     // ================= CATEGORY (OPTIMIZED 🔥) =================
//     if (category) {
//       const foundCategory = await CategoryModel
//         .findOne({
//           name: { $regex: `^${category}$`, $options: "i" }
//         })
//         .select("_id")
//         .lean(); // ✅ IMPORTANT

//       if (foundCategory) {
//         filter.category = foundCategory._id;
//       } else {
//         return res.status(200).json({
//           success: true,
//           message: "No products found",
//           total: 0,
//           page: pageNumber,
//           limit: limitNumber,
//           products: [],
//           categorySummary: []
//         });
//       }
//     }

//     // ================= SEARCH (SAME LOGIC BUT LIGHT) =================
//     if (search) {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // ================= PARALLEL EXECUTION 🚀 =================
//     const [total, productData, categorySummary] = await Promise.all([

//       // ✅ COUNT
//       ProductModel.countDocuments(filter),

//       // ✅ PRODUCTS (OPTIMIZED)
//       ProductModel.find(filter)
//         .select(`
//           _id mrProductId name description category subCategory 
//           variants gstPercent status images thumbnails createdAt label
//         `)
//         .populate("category", "name")
//         .populate("subCategory", "name")
//         .lean() // 🔥 BIG PERFORMANCE BOOST
//         .sort({ createdAt: -1 })
//         .skip((pageNumber - 1) * limitNumber)
//         .limit(limitNumber),

//       // ================= CATEGORY SUMMARY (OPTIMIZED 🚀) =================
//       (() => {
//         const summaryFilter = { ...filter };
//         delete summaryFilter.category;

//         return ProductModel.aggregate([
//           { $match: summaryFilter },

//           {
//             $group: {
//               _id: "$category",
//               count: { $sum: 1 }
//             }
//           },

//           {
//             $lookup: {
//               from: "categories",
//               localField: "_id",
//               foreignField: "_id",
//               pipeline: [
//                 { $match: { isActive: true } },
//                 { $project: { name: 1 } }
//               ],
//               as: "categoryInfo"
//             }
//           },

//           { $unwind: "$categoryInfo" },

//           {
//             $project: {
//               _id: 0,
//               category: "$categoryInfo.name",
//               count: 1
//             }
//           }
//         ]);
//       })()
//     ]);

//     // ================= SAME MAPPING (NO CHANGE ✅) =================
//     const products = productData.map((p) => ({
//       _id: p._id,
//       mrProductId: p.mrProductId,
//       name: p.name,
//       description: p.description,
//       category: p.category,
//       label: p.label,
//       subCategory: p.subCategory,
//       variants: p.variants,
//       gstPercent: p.gstPercent,
//       status: p.status,
//       images: p.images?.map((img) => img.url),
//       thumbnails: p.thumbnails?.map((img) => img.url),
//       createdAt: p.createdAt,
//     }));

//     // ================= RESPONSE =================
//     res.status(200).json({
//       success: true,
//       message: "Products fetched successfully",
//       total,
//       page: pageNumber,
//       limit: limitNumber,
//       products,
//       categorySummary,
//     });

//   } catch (err) {
//     console.error("getAllProducts error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again later."
//     });
//   }
// };



export const getAllProducts2 = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      store,
      category,
      status,
      name,
      search,
      sortBy, // optional: field to sort
      order   // optional: asc/desc
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    let filter = {};

    // ================= FILTERS =================
    if (store) filter.store = new mongoose.Types.ObjectId(store);
    if (status) filter.status = status;
    if (name) filter.name = { $regex: name, $options: "i" };

    console.log("category",category)

    // ================= CATEGORY =================
    if (category) {
      const foundCategory = await CategoryModel.findOne({
        name: { $regex: `^${category}$`, $options: "i" }
      }).select("_id").lean();

      if (foundCategory) filter.category = foundCategory._id;
      else
        return res.status(200).json({
          success: true,
          message: "No products found",
          total: 0,
          page: pageNumber,
          limit: limitNumber,
          products: [],
          categorySummary: []
        });
    }

    // ================= SEARCH =================
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // ================= SORTING =================
    let sortObj = { createdAt: -1 }; // default: newest first
    if (sortBy) {
      const sortOrder = order === "asc" ? 1 : -1;
      sortObj = { [sortBy]: sortOrder };
    }

    // ================= PARALLEL EXECUTION =================
    const [total, productData, categorySummary] = await Promise.all([
      // total count
      ProductModel.countDocuments(filter),

      // product data
      ProductModel.find(filter)
        .select(`
          _id mrProductId name slug description shortDesc category subCategory 
          variants gstPercent status images thumbnails createdAt label totalReviews
        `)
        .populate("category", "name")
        .populate("subCategory", "name")
        .lean()
        .sort(sortObj)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber),

      // category summary
      (async () => {
        const summaryFilter = { ...filter };
        delete summaryFilter.category;

        return ProductModel.aggregate([
          { $match: summaryFilter },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 }
            }
          },
          {
            $lookup: {
              from: "categories",
              localField: "_id",
              foreignField: "_id",
              pipeline: [
                { $match: { isActive: true } },
                { $project: { name: 1 } }
              ],
              as: "categoryInfo"
            }
          },
          { $unwind: "$categoryInfo" },
          {
            $project: {
              _id: 0,
              category: "$categoryInfo.name",
              count: 1
            }
          }
        ]);
      })()
    ]);

    // ================= MAP PRODUCTS =================
    const products = productData.map((p) => ({
      _id: p._id,
      mrProductId: p.mrProductId,
      slug:p.slug,
      name: p.name,
      description: p.description,
      shortDesc: p.shortDesc,
      category: p.category,
      label: p.label,
      subCategory: p.subCategory,
      variants: p.variants,
      gstPercent: p.gstPercent,
      status: p.status,
      totalReviews: p.totalReviews || 0, // include totalReviews
      images: p.images?.map((img) => img.url),
      thumbnails: p.thumbnails?.map((img) => img.url),
      createdAt: p.createdAt,
    }));

    // ================= RESPONSE =================
    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total,
      page: pageNumber,
      limit: limitNumber,
      products,
      categorySummary
    });

  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
};



export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      search,
      sortBy,
      order
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    let filter = {};
    let andFilters = [];

  

    // ✅ CATEGORY (id only)
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      const catId = new mongoose.Types.ObjectId(category);

      andFilters.push({
        $or: [
          { category: catId },
          { subCategory: catId }
        ]
      });
    }

    // ✅ SEARCH (ONLY NAME)
    if (search) {
      andFilters.push({
        name: { $regex: search, $options: "i" }
      });
    }

    // ✅ FINAL FILTER
    if (andFilters.length > 0) {
      filter.$and = andFilters;
    }

    // ✅ SORT
    // let sortObj = { createdAt: -1 };
    // if (sortBy) {
    //   sortObj = { [sortBy]: order === "asc" ? 1 : -1 };
    // }

    let sortObj = { createdAt: -1 };

if (sortBy) {
  if (sortBy === "averageRating") {
    // 🔥 TREND = rating + reviews priority
    sortObj = { averageRating: -1, totalReviews: -1 };
  } else if (sortBy === "createdAt") {
    sortObj = { createdAt: -1 };
  } else {
    sortObj = { [sortBy]: order === "asc" ? 1 : -1 };
  }
}

    // 🚀 PARALLEL FAST QUERY
    const [total, productData] = await Promise.all([
      ProductModel.countDocuments(filter),

      ProductModel.find(filter)
        .select(`
          _id mrProductId name slug description  shortDesc
          variants gstPercent status images createdAt label totalReviews averageRating customization
        `)
        .lean()
        .sort(sortObj)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
    ]);

    // ✅ SAME DATA (nothing removed)
    const products = productData.map((p) => ({
      _id: p._id,
      mrProductId: p.mrProductId,
      slug: p.slug,
      name: p.name,
      description: p.description,
      shortDesc: p.shortDesc,
      category: p.category,
      label: p.label,
      subCategory: p.subCategory,
      variants: p.variants,
      gstPercent: p.gstPercent,
      customization:p.customization,
      status: p.status,
reviews: p.totalReviews || 0,
averageRating: p.averageRating || 0,
      // images: p.images?.map((img) => img.url),
      images: p.images?.map((img) => ({
  url: img.url,
})) || [],
      createdAt: p.createdAt
    }));

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total,
      page: pageNumber,
      limit: limitNumber,
      products
    });

  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



// export const getAllProducts = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 20,
//       store,
//       category,
//       status,
//       name,
//       search
//     } = req.query;

//     const pageNumber = Number(page);
//     const limitNumber = Number(limit);

//     console.log("get the data from query", req.query);

//     let filter = {};

//     // ================= Optional filters =================
//     if (store) {
//       filter.store = new mongoose.Types.ObjectId(store);
//     }

//     if (status) filter.status = status;

//     if (name) {
//       filter.name = { $regex: name, $options: "i" };
//     }

//     // ================= Category Filter (NAME → ObjectId) =================
//     if (category) {
//       const foundCategory = await CategoryModel.findOne({
//         name: { $regex: `^${category}$`, $options: "i" }
//       }).select("_id");

//       if (foundCategory) {
//         filter.category = foundCategory._id;
//       } else {
//         return res.status(200).json({
//           success: true,
//           message: "No products found",
//           total: 0,
//           page: pageNumber,
//           limit: limitNumber,
//           products: [],
//           categorySummary: []
//         });
//       }
//     }

//     // ================= Search across name & description =================
//     if (search) {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // ================= Total count =================
//     const total = await ProductModel.countDocuments(filter);

//     // ================= Products with pagination & populate =================
//     const productData = await ProductModel.find(filter)
//       .populate("category", "name")
//       .populate("subCategory", "name")
//       .skip((pageNumber - 1) * limitNumber)
//       .limit(limitNumber)
//       .sort({ createdAt: -1 });

//     const products = productData.map((p) => ({
//       _id: p._id,
//       mrProductId: p.mrProductId,
//       name: p.name,
//       description: p.description,
//       category: p.category,
//       label: p.label,
//       subCategory: p.subCategory,
//       variants: p.variants,
//       gstPercent: p.gstPercent,
//       status: p.status,
//       images: p.images?.map((img) => img.url),
//       thumbnails: p.thumbnails?.map((img) => img.url),
//       createdAt: p.createdAt,
//     }));

//     // ================= Category Summary =================
//  // ================= Category Summary =================

// // remove category filter for summary
// const summaryFilter = { ...filter };
// delete summaryFilter.category;

// const categorySummary = await ProductModel.aggregate([
//   { $match: summaryFilter },
//   {
//     $group: {
//       _id: "$category",
//       count: { $sum: 1 }
//     }
//   },
//   {
//     $lookup: {
//       from: "categories",
//       localField: "_id",
//       foreignField: "_id",
//       as: "categoryInfo"
//     }
//   },
//   {
//     $unwind: "$categoryInfo"
//   },
//   {
//     $match: {
//       "categoryInfo.isActive": true
//     }
//   },
//   {
//     $project: {
//       _id: 0,
//       category: "$categoryInfo.name",
//       count: 1
//     }
//   }
// ]);

//     // ================= Response =================
//     res.status(200).json({
//       success: true,
//       message: "Products fetched successfully",
//       total,
//       page: pageNumber,
//       limit: limitNumber,
//       products,
//       categorySummary,
//     });

//   } catch (err) {
//     console.error("getAllProducts error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again later."
//     });
//   }
// };



export const applyCoupon = async (req, res) => {
  try {
    console.log("----- APPLY COUPON API HIT -----");

    console.log("req.user", req.user);

    
    const { code, orderAmount } = req.query;

    console.log("Incoming Query:", { code, orderAmount });

    if (!code || !orderAmount) {
      console.log("❌ Missing code or orderAmount");
      return res.status(400).json({
        success: false,
        message: "Coupon code and order amount are required"
      });
    }

    const amount = Number(orderAmount);

    if (isNaN(amount) || amount <= 0) {
      console.log("❌ Invalid order amount:", orderAmount);
      return res.status(400).json({
        success: false,
        message: "Invalid order amount"
      });
    }

    const coupon = await CouponModel.findOne({
      code: code.toUpperCase(),
      status: "ACTIVE"
    });

    if (!coupon) {
      console.log("❌ Coupon not found or inactive:", code);
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive coupon"
      });
    }

    console.log("✅ Coupon Found:", {
      id: coupon._id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value
    });

    const now = new Date();

    if (now < coupon.startDate) {
      console.log("❌ Coupon not started yet");
      return res.status(400).json({
        success: false,
        message: "Coupon not started yet"
      });
    }

    if (now > coupon.endDate) {
      console.log("❌ Coupon expired");
      return res.status(400).json({
        success: false,
        message: "Coupon expired"
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      console.log("❌ Usage limit exceeded");
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit exceeded"
      });
    }

    if (amount < coupon.minOrderAmount) {
      console.log("❌ Below minimum order amount");
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${coupon.minOrderAmount}`
      });
    }

    // User usage check
    if (req.user?._id) {
      console.log("Checking usage for user:", req.user._id);

      const alreadyUsed = await CouponUsageModel.findOne({
        coupon: coupon._id,
        user: req.user._id
      });

      if (alreadyUsed) {
        console.log("❌ User already used this coupon");
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon"
        });
      }
    }

    let discount = 0;

    if (coupon.type === "PERCENT") {
      discount = (amount * coupon.value) / 100;

      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    }

    if (coupon.type === "FLAT") {
      discount = coupon.value;
    }

    discount = Math.min(discount, amount);

    const finalAmount = amount - discount;

    console.log("🎉 Coupon Applied Successfully");
    console.log("Coupon Code:", coupon.code);
    console.log("Order Amount:", amount);
    console.log("Discount Given:", discount);
    console.log("Final Amount:", finalAmount);
    console.log("Response Sent ✅");

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      couponCode: coupon.code,
      orderAmount: amount,
      discount,
      finalAmount,
      couponId: coupon._id
    });

  } catch (error) {
    console.error("❌ Apply coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// export const getSingleProductDetails = async (req, res) => {
//   try {
//     const { id, slug } = req.query;

//     console.log("get data from frontend:", req.query);

//     // ✅ REQUIRED VALIDATION
//     if (!id && !slug) {
//       return res.status(400).json({
//         success: false,
//         message: "Product id or slug is required",
//       });
//     }

//     let filter = {};

//     // ✅ FILTER BY ID
//     if (id) {
//       if (!mongoose.Types.ObjectId.isValid(id)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid product id",
//         });
//       }
//       filter._id = new mongoose.Types.ObjectId(id);
//     }

//     // ✅ FILTER BY SLUG (NAME)
//     if (slug) {
//       filter.name = { $regex: `^${slug}$`, $options: "i" };
//     }

//     // ================= PARALLEL FETCH 🚀 =================
//     const [product, reviews] = await Promise.all([
//       ProductModel.findOne(filter)
//         .populate("category", "name")
//         .populate("subCategory", "name")
//         .populate("store", "name")
//         .lean(),

//       ReviewModel.find(filter._id ? { product: filter._id } : {})
//         .populate("user", "name")
//         .sort({ createdAt: -1 })
//         .lean(),
//     ]);

//     // ✅ PRODUCT NOT FOUND
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     console.log("found product:", product.name);

//     // ================= CALCULATE RATING =================
//     const totalReviews = reviews.length;

//     const averageRating =
//       totalReviews > 0
//         ? (
//             reviews.reduce((acc, r) => acc + r.rating, 0) /
//             totalReviews
//           ).toFixed(1)
//         : 0;

//     // ================= RESPONSE FORMAT =================
//     const formattedProduct = {
//       _id: product._id,
//       id: product._id,
//       mrProductId: product.mrProductId,
//       name: product.name,
//       description: product.description,
//       category: product.category,
//       subCategory: product.subCategory,
//       store: product.store,

//       label: product.label,
//       variants: product.variants,
//       attributes: product.attributes,

//       gstPercent: product.gstPercent,
//       status: product.status,

//       images: product.images?.map((img) => img.url),
//       thumbnails: product.thumbnails?.map((img) => img.url),

//       averageRating: Number(averageRating),
//       totalReviews,

//       createdAt: product.createdAt,

//       // ✅ SEO META
//       meta: {
//         title: product.name,
//         description:
//           product.description?.slice(0, 150) ||
//           `Buy ${product.name} at best price`,
//       },
//     };

//     // ================= SUCCESS RESPONSE =================
//     return res.status(200).json({
//       success: true,
//       message: "Product details fetched successfully",
//       product: formattedProduct,
//       reviews,
//     });

//   } catch (err) {
//     console.error("getSingleProductDetails error:", err);

//     return res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };


export const getSingleProductDetails = async (req, res) => {
  try {
    const { slug } = req.params;

    // ================= VALIDATION =================
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Product slug is required",
      });
    }

    // ================= PRODUCT FETCH =================
    const product = await ProductModel.findOne({
      slug: { $regex: `^${slug}$`, $options: "i" },
    })
      .populate("category", "name")
      .populate("subCategory", "name")
      .populate("store", "name")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // ================= REVIEWS FETCH =================
    const reviews = await ReviewModel.find({ product: product._id })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .lean();

    // ================= RATING =================
    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? Number(
            (
              reviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
              totalReviews
            ).toFixed(1)
          )
        : 0;

    // ================= FORMAT RESPONSE =================
    // const formattedProduct = {
    //   id: product._id,
    //   name: product.name,
    //   slug: product.slug,
    //   description: product.description,

    //   category: product.category,
    //   subCategory: product.subCategory,
    //   store: product.store,

    //   label: product.label,
    //   variants: product.variants || [],
    //   attributes: product.attributes || [],

    //   gstPercent: product.gstPercent,
    //   status: product.status,

    //   images: product.images?.map((img) => img.url) || [],
    //   thumbnails: product.thumbnails?.map((img) => img.url) || [],

    //   averageRating,
    //   totalReviews,

    //   createdAt: product.createdAt,

    //   // ✅ SEO
    //   meta: {
    //     title: product.name,
    //     description:
    //       product.description?.slice(0, 150) ||
    //       `Buy ${product.name} at best price`,
    //   },
    // };

    // ================= RESPONSE =================
    return res.status(200).json({
      success: true,
      product:product,
      reviews,
    });
  } catch (error) {
    console.error("Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
/**
 * Check if coupon is active and valid
 * Query params:
 *  - couponCode (required)
 * User is optional
 */
export const checkCouponActiveOrNot = async (req, res) => {
  try {
    const { couponCode } = req.query;
    const userId = req.user?._id; // from optional auth middleware

    if (!couponCode) {
      return res.status(400).json({ success: false, message: "Coupon code is required" });
    }

    // Find active coupon within date range
    const coupon = await CouponModel.findOne({
      code: couponCode.toUpperCase(),
      status: "ACTIVE",
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found or inactive" });
    }

    // If user is logged in, check if they already used the coupon
    if (userId) {
      const usage = await CouponUsageModel.findOne({ coupon: coupon._id, user: userId });
      if (usage) {
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon",
        });
      }
    }

    // Success response
    return res.json({
      success: true,
      message: "Coupon is valid",
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
      },
    });
  } catch (err) {
    console.error("checkCouponActiveOrNot:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// export const getAllProducts = async (req, res) => {
//   try {
//  const {
//   page = 1,
//   limit = 20,
//   store,
//   category,
//   status,
//   name,
//   search
// } = req.query;




//     console.log("get the data from body",req.query)

//     let filter = {};

//     // ================= Optional filters =================
//     if (store) filter.store = store;
//     if (category) filter.category = category;
//     if (status) filter.status = status;
//     if (name) filter.name = { $regex: name, $options: "i" };

//     // ================= Search across name & description =================
//     if (search) {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // ================= Total count =================
//     const total = await ProductModel.countDocuments(filter);

//     // ================= Products with pagination & populate =================
//     const productData = await ProductModel.find(filter)
//       .populate("category", "name")
//       .populate("subCategory", "name")
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     const products = productData.map((p) => ({
//       _id: p._id,
//       mrProductId: p.mrProductId,
//       name: p.name,
//       description: p.description,
//       category: p.category,
//       label: p.label,
//       subCategory: p.subCategory,
//       variants: p.variants,
//       gstPercent: p.gstPercent,
//       status: p.status,
//       images: p.images?.map((img) => img.url),
//       thumbnails: p.thumbnails?.map((img) => img.url),
//       createdAt: p.createdAt,
//     }));

//     // ================= Category & Subcategory Summary =================
//    // ================= Category Summary =================
// const categorySummary = await ProductModel.aggregate([
//   { $match: filter },
//   {
//     $group: {
//       _id: "$category", // group by category only
//       count: { $sum: 1 }
//     }
//   },
//   {
//     $lookup: {
//       from: "categories", // your categories collection
//       localField: "_id",
//       foreignField: "_id",
//       as: "categoryInfo"
//     }
//   },
//   {
//     $project: {
//       _id: 0,
//       category: { $arrayElemAt: ["$categoryInfo.name", 0] },
//       count: 1
//     }
//   }
// ]);

//     // ================= Response =================
//     res.status(200).json({
//       success: true,
//       message: "Products fetched successfully",
//       total,
//       page,
//       limit,
//       products,
//       categorySummary, // ✅ added summary
//     });

//   } catch (err) {
//     console.error("getAllProducts error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again later."
//     });
//   }
// };

