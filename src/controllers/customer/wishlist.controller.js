import mongoose from "mongoose";
import Wishlist from "../../models/Wishlist.model.js";
import Product from "../../models/Product.model.js";


// ==========================
// 🔹 GET WISHLIST
// ==========================
// export const getWishlist = async (req, res) => {
//   try {
//     const customerId = req.user._id;

//     const wishlist = await Wishlist.findOne({ customerId }).populate(
//       "items.productId"
//     );

//     if (!wishlist) {
//       return res.status(200).json({
//         success: true,
//         items: [],
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       items: wishlist.items,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch wishlist",
//       error: error.message,
//     });
//   }
// };



export const getWishlist = async (req, res) => {
  try {
    const customerId = req.user._id;

    const wishlist = await Wishlist.findOne({ customerId })
      .populate({
        path: "items.productId",
        select: "name images gstPercent variants label status",
      });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        items: [],
      });
    }

    const formattedItems = wishlist.items.map((item) => {
      const product = item.productId;

      if (!product) return null;

      // 🔥 find correct variant
      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId?.toString()
      );

      return {
        productId: product._id.toString(),
        variantId: item.variantId?.toString(),
        name: product.name,
        variantLabel: product.label || "Weight",
        variantValue: variant?.value || "",
        mrp: variant?.mrp || 0,
        sellingPrice: variant?.sellingPrice || 0,
        stockQty: variant?.stockQty || 0,
        gstPercent: product.gstPercent || 0,
        quantity: 1,
        images: product.images?.map((img) => img.url) || [],
      };
    }).filter(Boolean); // remove null

    return res.status(200).json({
      success: true,
      items: formattedItems,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wishlist",
      error: error.message,
    });
  }
};
// ==========================
// 🔹 ADD TO WISHLIST
// ==========================
// export const addToWishlist = async (req, res) => {
//   try {
//     const customerId = req.user._id;
//     const { productId, variantId } = req.body;

//     // 🔎 Validation
//     if (!productId) {
//       return res.status(400).json({
//         success: false,
//         message: "ProductId is required",
//       });
//     }

//     if (!mongoose.Types.ObjectId.isValid(productId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid productId",
//       });
//     }

//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: "Product not found",
//       });
//     }

//     let wishlist = await Wishlist.findOne({ customerId });

//     if (!wishlist) {
//       wishlist = new Wishlist({
//         customerId,
//         items: [],
//       });
//     }

//     const alreadyExists = wishlist.items.find(
//       (item) =>
//         item.productId.toString() === productId &&
//         item.variantId?.toString() === variantId
//     );

//     if (alreadyExists) {
//       return res.status(400).json({
//         success: false,
//         message: "Product already in wishlist",
//       });
//     }

//     wishlist.items.push({
//       productId,
//       variantId,
//     });

//     await wishlist.save();

//     return res.status(200).json({
//       success: true,
//       message: "Added to wishlist",
//       items: wishlist.items,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to add to wishlist",
//       error: error.message,
//     });
//   }
// };


export const addToWishlist = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { productId, variantId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "ProductId is required",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 🔥 validate variant exists
    const variant = product.variants.find(
      (v) => v._id.toString() === variantId?.toString()
    );

    if (!variant) {
      return res.status(400).json({
        success: false,
        message: "Invalid variant",
      });
    }

    let wishlist = await Wishlist.findOne({ customerId });

    if (!wishlist) {
      wishlist = new Wishlist({
        customerId,
        items: [],
      });
    }

    const alreadyExists = wishlist.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.variantId?.toString() === variantId
    );

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    wishlist.items.push({
      productId,
      variantId,
    });

    await wishlist.save();

    // 🔥 populate after save
    await wishlist.populate({
      path: "items.productId",
      select: "name images gstPercent variants label status",
    });

    // 🔥 format same as GET
    const formattedItems = wishlist.items.map((item) => {
      const product = item.productId;
      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId?.toString()
      );

      return {
        productId: product._id.toString(),
        variantId: item.variantId?.toString(),
        name: product.name,
        variantLabel: product.label || "Weight",
        variantValue: variant?.value || "",
        mrp: variant?.mrp || 0,
        sellingPrice: variant?.sellingPrice || 0,
        stockQty: variant?.stockQty || 0,
        gstPercent: product.gstPercent || 0,
        quantity: 1,
        images: product.images?.map((img) => img.url) || [],
      };
    });

    return res.status(200).json({
      success: true,
      message: "Added to wishlist",
      items: formattedItems,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to add to wishlist",
      error: error.message,
    });
  }
};




export const removeFromWishlist = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { productId, variantId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "ProductId is required" });
    }

    const wishlist = await Wishlist.findOne({ customerId }).populate({
      path: "items.productId",
      select: "name images sellingPrice mrp gstPercent variants stock",
    });

    if (!wishlist) return res.status(404).json({ success: false, message: "Wishlist not found" });

    wishlist.items = wishlist.items.filter(
      (item) =>
        !(item.productId._id.toString() === productId && item.variantId?.toString() === variantId)
    );

    await wishlist.save();

    // Map full details to return
    const itemsWithDetails = wishlist.items.map((item) => {
      const product = item.productId;
      const variant = product.variants?.find((v) => v._id.toString() === item.variantId?.toString());
      return {
        productId: product._id,
        variantId: variant?._id,
        name: product.name,
        // images: product.images,
         images:product.images?.map((img) => img.url) || [],
        sellingPrice: variant?.sellingPrice || product.sellingPrice,
        mrp: variant?.mrp || product.mrp,
        stockQty: variant?.stockQty || product.stockQty,
        gstPercent: product.gstPercent || 0,
        variantLabel: variant?.label || "",
        variantValue: variant?.value || "",
        quantity: 1,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Removed from wishlist",
      items: itemsWithDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to remove from wishlist",
      error: error.message,
    });
  }
};
// ==========================
// 🔹 REMOVE FROM WISHLIST
// ==========================
// export const removeFromWishlist = async (req, res) => {
//   try {
//     const customerId = req.user._id;
//     const { productId, variantId } = req.body;

//     if (!productId) {
//       return res.status(400).json({
//         success: false,
//         message: "ProductId is required",
//       });
//     }

//     const wishlist = await Wishlist.findOne({ customerId });

//     if (!wishlist) {
//       return res.status(404).json({
//         success: false,
//         message: "Wishlist not found",
//       });
//     }

//     wishlist.items = wishlist.items.filter(
//       (item) =>
//         !(
//           item.productId.toString() === productId &&
//           item.variantId?.toString() === variantId
//         )
//     );

//     await wishlist.save();

//     return res.status(200).json({
//       success: true,
//       message: "Removed from wishlist",
//       items: wishlist.items,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Failed to remove from wishlist",
//       error: error.message,
//     });
//   }
// };



// ==========================
// 🔹 CLEAR WISHLIST
// ==========================
export const clearWishlist = async (req, res) => {
  try {
    const customerId = req.user._id;

    await Wishlist.findOneAndDelete({ customerId });

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared",
      items: [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to clear wishlist",
      error: error.message,
    });
  }
};


export const moveToCartFromWishlist = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { productId, variantId } = req.body;

    const wishlist = await Wishlist.findOne({ customerId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    // Remove from wishlist
    wishlist.items = wishlist.items.filter(
      (item) =>
        !(
          item.productId.toString() === productId &&
          item.variantId?.toString() === variantId
        )
    );

    await wishlist.save();

    // Add to cart (reuse your cart logic)
    await CartService.addItem(customerId, productId, variantId, 1);

    return res.status(200).json({
      success: true,
      message: "Moved to cart successfully",
      items: wishlist.items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to move item",
      error: error.message,
    });
  }
};