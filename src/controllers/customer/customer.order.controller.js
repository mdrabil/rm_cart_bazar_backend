import mongoose from "mongoose";
import Order from "../../models/Order.model.js";
import Cart from "../../models/Cart.model.js";
import Coupon from "../../models/Coupon.model.js";
import CouponUsage from "../../models/CouponUsage.model.js";
import Product from "../../models/Product.model.js";
import { ORDER_STATUS } from "../../constants/enums.js";
import { generateRMId, generateTransactionId } from "../../utils/rmId.js";
import Customer from "../../models/Customer.js";
import { getDistanceKm } from "../../utils/getDistanceKm.js";
import StoreModel from "../../models/Store.model.js";




// export const placeOrderController = async (req, res) => {
//   if (!req.user) {
//     return res.status(401).json({
//       success: false,
//       message: "Unauthorized. Please login first."
//     });
//   }

//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const customerId = req.user._id;
//     let { paymentMethod, deliveryAddress, notes, deliverySlot, couponCode, deliveryDate,layer } = req.body;

//     // Fetch cart with product data
//     const cart = await Cart.findOne({ customerId })
//       .populate("items.productId")
//       .session(session);

//     if (!cart || cart.items.length === 0) {
//       throw new Error("Cart is empty");
//     }

//     let totalAmount = 0;
//     let gstAmount = 0;
//     let discountAmount = 0;
//     let storeId = null;
//     const orderItems = [];

//     // ================= LOOP CART ITEMS =================
//     for (const item of cart.items) {
//       const product = item.productId;
//       if (!product) throw new Error("Product not found");

//       const variant = product.variants.id(item.variantId);
//       if (!variant || !variant.isActive) throw new Error("Variant not available");

//       const price = Number(variant.sellingPrice) || 0;
//       const qty = Number(item.qty) || 0;
//       const gstPercent = Number(product.gstPercent) || 0;

//       if (price <= 0 || qty <= 0) throw new Error("Invalid price or quantity");
//       if (variant.stockQty < qty) throw new Error(`${product.name} (${variant.value}) out of stock`);

//       if (!storeId) storeId = product.store;



//       const itemTotal = price * qty;
//       const itemGST = (itemTotal * gstPercent) / 100;

//       totalAmount += itemTotal;
//       gstAmount += itemGST;

//       orderItems.push({
//         productName: product.name,
//         variantLabel: variant.value,
//         sellingPrice: price,
//         qty,
//         gstPercent
//       });

//       // 🔥 Atomic variant stock reduce
//       const stockUpdate = await Product.updateOne(
//         {
//           _id: product._id,
//           "variants._id": variant._id,
//           "variants.stockQty": { $gte: qty }
//         },
//         { $inc: { "variants.$.stockQty": -qty } },
//         { session }
//       );

//       if (stockUpdate.modifiedCount === 0) throw new Error("Stock update failed");
//     }

//     totalAmount = Number(totalAmount.toFixed(2));
//     gstAmount = Number(gstAmount.toFixed(2));

//     // ================= COUPON =================
//     let appliedCoupon = null;

//     if (couponCode) {
//       const coupon = await Coupon.findOne({
//         code: couponCode.toUpperCase(),
//         status: "ACTIVE"
//       }).session(session);

//       if (!coupon) throw new Error("Invalid coupon");

//       const now = new Date();
//       if (now < coupon.startDate || now > coupon.endDate) throw new Error("Coupon expired");

//       if (totalAmount < coupon.minOrderAmount) throw new Error("Minimum order amount not reached");

//       const alreadyUsed = await CouponUsage.findOne({
//         coupon: coupon._id,
//         user: customerId
//       }).session(session);

//       if (alreadyUsed) throw new Error("You already used this coupon");

//       if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit reached");

//       if (coupon.type === "PERCENT") {
//         discountAmount = (totalAmount * coupon.value) / 100;
//           if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
//         discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
//     }


        
//       } else {
//         discountAmount = coupon.value;
//       }

//       discountAmount = Math.min(discountAmount, totalAmount);
//       discountAmount = Number(discountAmount.toFixed(2));

//       const updatedCoupon = await Coupon.findOneAndUpdate(
//         {
//           _id: coupon._id,
//           $or: [
//             { usageLimit: { $exists: false } },
//             { usageLimit: null },
//             { usedCount: { $lt: coupon.usageLimit } }
//           ]
//         },
//         { $inc: { usedCount: 1 } },
//         { new: true, session }
//       );

//       if (!updatedCoupon) throw new Error("Coupon usage limit reached");

//       await CouponUsage.create([{ coupon: coupon._id, user: customerId }], { session });
//       appliedCoupon = coupon.code;
//     }

//     const payableAmount = Number((totalAmount + gstAmount - discountAmount).toFixed(2));

//     // Payment mapping
//     const map = { cash: "COD", cod: "COD", online: "ONLINE", upi: "UPI", wallet: "WALLET" };
//     const finalPaymentMethod = map[paymentMethod?.toLowerCase()] || "COD";

//     const rmOrderId = await generateRMId("ORD", "ORDER");
//     const transactionId = generateTransactionId() || null;

//     // Default delivery date if not provided
//     if (!deliveryDate) {
//       const today = new Date();
//       const defaultDelivery = new Date();
//       defaultDelivery.setDate(today.getDate() + 7);
//       deliveryDate = defaultDelivery;
//     }

  

//     let isNewAddress = true;

// const existingAddress = req.user.addresses.find(addr =>
//   addr.fullAddress === deliveryAddress.fullAddress &&
//   addr.addressLine === deliveryAddress.addressLine &&
//   addr.mobile === deliveryAddress.mobile &&
//   addr.city === deliveryAddress.city &&
//   addr.state === deliveryAddress.state &&
//   addr.pincode === deliveryAddress.pincode &&
//   addr.type === deliveryAddress.type
// );

// if (existingAddress) {
//   isNewAddress = false;
// }

// if (isNewAddress) {
//   await Customer.updateOne(
//     { _id: customerId },
//     {
//       $push: {
//         addresses: {
//           ...deliveryAddress,
//           location: {
//             type: "Point",
//             coordinates: [
//               deliveryAddress.longitude,
//               deliveryAddress.latitude
//             ]
//           }
//         }
//       }
//     },
//     { session }
//   );
// }

// const nearestStore = await StoreModel.findOne({
//   "address.location": {
//     $near: {
//       $geometry: {
//         type: "Point",
//         coordinates: [
//           deliveryAddress.longitude,
//           deliveryAddress.latitude
//         ]
//       },
//       $maxDistance: 20000000
//     }
//   }
// });

// console.log("get store",nearestStore)

// const storeLat = nearestStore.address.location.coordinates[1];
// const storeLng = nearestStore.address.location.coordinates[0];

// const distanceKm = getDistanceKm(
//   deliveryAddress.latitude,
//   deliveryAddress.longitude,
//   storeLat,
//   storeLng
// );

// console.log("get the distacne",distanceKm)
//     // ================= CREATE ORDER =================
// const order = await Order.create([
//   {
//     rmOrderId,
//     customerId,
//     store: nearestStore._id,

//     items: orderItems,
//     totalAmount,
//     gstAmount,
//     discountAmount,
//     payableAmount,

//     deliveryAddress: {
//       ...deliveryAddress,
//       location: {
//         type: "Point",
//         coordinates: [
//           deliveryAddress.longitude,
//           deliveryAddress.latitude
//         ]
//       }
//     },

//     deliveryMeta: {
//       distanceKm: Number(distanceKm.toFixed(2)),
//       assignedStoreType: isNewAddress ? "AUTO_NEW_ADDRESS" : "AUTO_EXISTING"
//     },

//     paymentMethod: finalPaymentMethod,
//     notes,
//     deliverySlot,
//     status: ORDER_STATUS.PLACED,
//     deliveryDate
//   }
// ], { session });

//     // Clear cart
//     await Cart.updateOne({ customerId }, { $set: { items: [] } }, { session });

//     // Commit transaction
//     await session.commitTransaction();
//     session.endSession();

//     // Fetch updated user for frontend / Redux
//     const updatedUser = await Customer.findById(customerId).lean();

//     return res.status(201).json({
//       success: true,
//       message: "Order placed successfully",
//       txnId: transactionId,
//       orderId: order[0]?._id,
//       order: order[0],
//       user: updatedUser
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     return res.status(400).json({
//       success: false,
//       message: error.message || "Order failed"
//     });
//   }
// };

export const placeOrderController = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Please login first."
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customerId = req.user._id;

    let {
      paymentMethod,
      deliveryAddress,
      notes,
      deliverySlot,
      couponCode,
      deliveryDate
    } = req.body;

    // ================= FETCH CART =================
    const cart = await Cart.findOne({ customerId })
      .populate("items.productId")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    let totalAmount = 0;
    let gstAmount = 0;
    let discountAmount = 0;
    let storeId = null;

    const orderItems = [];

    // ================= LOOP CART ITEMS =================
    for (const item of cart.items) {
      const product = item.productId;

      if (!product) {
        throw new Error("Product not found");
      }

      const variant = product.variants.id(item.variantId);

      if (!variant || !variant.isActive) {
        throw new Error("Variant not available");
      }

      const price = Number(variant.sellingPrice) || 0;
      const qty = Number(item.qty) || 0;
      const gstPercent = Number(product.gstPercent) || 0;

      if (price <= 0 || qty <= 0) {
        throw new Error("Invalid price or quantity");
      }

      if (variant.stockQty < qty) {
        throw new Error(`${product.name} (${variant.value}) out of stock`);
      }

      if (!storeId) {
        storeId = product.store;
      }

      const itemTotal = price * qty;
      const itemGST = (itemTotal * gstPercent) / 100;

      totalAmount += itemTotal;
      gstAmount += itemGST;

      // ================= CUSTOMIZE =================
      const layer = item.layer
        ? {
            ...item.layer.toObject?.(),
            isCustomized: !!item.layer?.text?.trim()
          }
        : null;

      // ================= PUSH ORDER ITEM =================
      orderItems.push({
        productId: product._id,

        variantId: variant._id,

        productName: product.name,

        variantLabel: variant.value,

        sellingPrice: price,

        qty,

        gstPercent,

        // ✅ CUSTOMIZE SAVE
        layer
      });

      // ================= STOCK UPDATE =================
      const stockUpdate = await Product.updateOne(
        {
          _id: product._id,
          "variants._id": variant._id,
          "variants.stockQty": { $gte: qty }
        },
        {
          $inc: {
            "variants.$.stockQty": -qty
          }
        },
        { session }
      );

      if (stockUpdate.modifiedCount === 0) {
        throw new Error("Stock update failed");
      }
    }

    totalAmount = Number(totalAmount.toFixed(2));
    gstAmount = Number(gstAmount.toFixed(2));

    // ================= COUPON =================
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        status: "ACTIVE"
      }).session(session);

      if (!coupon) {
        throw new Error("Invalid coupon");
      }

      const now = new Date();

      if (now < coupon.startDate || now > coupon.endDate) {
        throw new Error("Coupon expired");
      }

      if (totalAmount < coupon.minOrderAmount) {
        throw new Error("Minimum order amount not reached");
      }

      const alreadyUsed = await CouponUsage.findOne({
        coupon: coupon._id,
        user: customerId
      }).session(session);

      if (alreadyUsed) {
        throw new Error("You already used this coupon");
      }

      if (
        coupon.usageLimit &&
        coupon.usedCount >= coupon.usageLimit
      ) {
        throw new Error("Coupon usage limit reached");
      }

      if (coupon.type === "PERCENT") {
        discountAmount = (totalAmount * coupon.value) / 100;

        if (
          coupon.maxDiscountAmount &&
          coupon.maxDiscountAmount > 0
        ) {
          discountAmount = Math.min(
            discountAmount,
            coupon.maxDiscountAmount
          );
        }
      } else {
        discountAmount = coupon.value;
      }

      discountAmount = Math.min(discountAmount, totalAmount);

      discountAmount = Number(discountAmount.toFixed(2));

      const updatedCoupon = await Coupon.findOneAndUpdate(
        {
          _id: coupon._id,
          $or: [
            { usageLimit: { $exists: false } },
            { usageLimit: null },
            { usedCount: { $lt: coupon.usageLimit } }
          ]
        },
        {
          $inc: {
            usedCount: 1
          }
        },
        {
          new: true,
          session
        }
      );

      if (!updatedCoupon) {
        throw new Error("Coupon usage limit reached");
      }

      await CouponUsage.create(
        [
          {
            coupon: coupon._id,
            user: customerId
          }
        ],
        { session }
      );

      appliedCoupon = coupon.code;
    }

    // ================= FINAL PAYABLE =================
    const payableAmount = Number(
      (
        totalAmount +
        gstAmount -
        discountAmount
      ).toFixed(2)
    );

    // ================= PAYMENT =================
    const map = {
      cash: "COD",
      cod: "COD",
      online: "ONLINE",
      upi: "UPI",
      wallet: "WALLET"
    };

    const finalPaymentMethod =
      map[paymentMethod?.toLowerCase()] || "COD";

    const rmOrderId = await generateRMId("ORD", "ORDER");

    const transactionId = generateTransactionId() || null;

    // ================= DELIVERY DATE =================
    if (!deliveryDate) {
      const today = new Date();

      const defaultDelivery = new Date();

      defaultDelivery.setDate(today.getDate() + 7);

      deliveryDate = defaultDelivery;
    }

    // ================= SAVE ADDRESS =================
    let isNewAddress = true;

    const existingAddress = req.user.addresses.find(
      (addr) =>
        addr.fullAddress === deliveryAddress.fullAddress &&
        addr.addressLine === deliveryAddress.addressLine &&
        addr.mobile === deliveryAddress.mobile &&
        addr.city === deliveryAddress.city &&
        addr.state === deliveryAddress.state &&
        addr.pincode === deliveryAddress.pincode &&
        addr.type === deliveryAddress.type
    );

    if (existingAddress) {
      isNewAddress = false;
    }

    if (isNewAddress) {
      await Customer.updateOne(
        { _id: customerId },
        {
          $push: {
            addresses: {
              ...deliveryAddress,

              location: {
                type: "Point",

                coordinates: [
                  deliveryAddress.longitude,
                  deliveryAddress.latitude
                ]
              }
            }
          }
        },
        { session }
      );
    }

    // ================= FIND NEAREST STORE =================
    const nearestStore = await StoreModel.findOne({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",

            coordinates: [
              deliveryAddress.longitude,
              deliveryAddress.latitude
            ]
          },

          $maxDistance: 20000000
        }
      }
    });

    const storeLat =
      nearestStore.address.location.coordinates[1];

    const storeLng =
      nearestStore.address.location.coordinates[0];

    const distanceKm = getDistanceKm(
      deliveryAddress.latitude,
      deliveryAddress.longitude,
      storeLat,
      storeLng
    );

    // ================= CREATE ORDER =================
    const order = await Order.create(
      [
        {
          rmOrderId,

          customerId,

          store: nearestStore._id,

          items: orderItems,

          totalAmount,

          gstAmount,

          discountAmount,

          payableAmount,

          couponCode: appliedCoupon,

          paymentMethod: finalPaymentMethod,

          paymentStatus:
            finalPaymentMethod === "COD"
              ? "PENDING"
              : "PAID",

          transactionId,

          notes,

          deliverySlot,

          deliveryDate,

          status: ORDER_STATUS.PLACED,

          deliveryAddress: {
            ...deliveryAddress,

            location: {
              type: "Point",

              coordinates: [
                deliveryAddress.longitude,
                deliveryAddress.latitude
              ]
            }
          },

          deliveryMeta: {
            distanceKm: Number(
              distanceKm.toFixed(2)
            ),

            assignedStoreType: isNewAddress
              ? "AUTO_NEW_ADDRESS"
              : "AUTO_EXISTING"
          }
        }
      ],
      { session }
    );

    // ================= CLEAR CART =================
    await Cart.updateOne(
      { customerId },
      {
        $set: {
          items: []
        }
      },
      { session }
    );

    // ================= COMMIT =================
    await session.commitTransaction();

    session.endSession();

    // ================= UPDATED USER =================
    const updatedUser = await Customer.findById(
      customerId
    ).lean();

    return res.status(201).json({
      success: true,

      message: "Order placed successfully",

      txnId: transactionId,

      orderId: order[0]?._id,

      order: order[0],

      user: updatedUser
    });

  } catch (error) {
    await session.abortTransaction();

    session.endSession();

    return res.status(400).json({
      success: false,

      message: error.message || "Order failed"
    });
  }
};

export const getMyOrdersController = async (req, res) => {
  try {
    // ✅ Login check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first."
      });
    }

    const customerId = req.user._id;

    // ================= QUERY PARAMS =================
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    const skip = (pageNumber - 1) * pageSize;

    // ================= FILTER BUILD =================
    const filter= {
      customerId
    };

    console.log("get the the order",status)

    // ✅ Normalize status
 // ✅ Normalize status with case-insensitive regex
if (status && typeof status === "string" && status.trim() !== "") {
  const s = status.trim();
  filter.status = { $regex: `^${s}$`, $options: "i" }; // matches ignoring case
}

    // ✅ Normalize date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // ✅ Normalize search
    if (search && typeof search === "string" && search.trim() !== "") {
      const s = search.trim().toLowerCase();
      filter.$or = [
        { rmOrderId: { $regex: s, $options: "i" } },
        { status: { $regex: s, $options: "i" } }
      ];
    }

    // ================= SORT =================
    const sortOptions = {
      [sortBy]: sortOrder === "asc" ? 1 : -1
    };

    // ================= QUERY =================
    const [orders, total] = await Promise.all([
      Order.find(filter)
        // .populate("store", "name")
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .lean(),

      Order.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      orders
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders"
    });
  }
};



export const updateMyOrderStatusController = async (req, res) => {
  try {
    // ✅ Login check
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    const customerId = req.user._id;
    const { orderId } = req.params; // orderId from URL
    const { status, reason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    // ✅ Find the order belonging to logged-in user
    const order = await Order.findOne({ _id: orderId, customerId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ✅ Prevent updating if already delivered
    if (order.status === ORDER_STATUS.DELIVERED) {
      return res.status(400).json({ success: false, message: "Delivered order cannot be updated" });
    }

    // ✅ Update status + optional reason
    order.status = status.toUpperCase();
    if (reason) order.reason = reason;

    // ✅ Save will trigger pre-save middleware to update timeline
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("updateOrderStatusController error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};


// ================= GET SINGLE ORDER =================
export const getSingleOrderController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      customerId: req.user._id
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order"
    });
  }
};
// export const getMyOrdersController = async (req, res) => {


//   try {
//     // ✅ Login check
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized. Please login first."
//       });
//     }

//     const customerId = req.user._id;

//     // ================= QUERY PARAMS =================
//     const {
//       page = 1,
//       limit = 10,
//       status,
//       search,
//       startDate,
//       endDate,
//       sortBy = "createdAt",
//       sortOrder = "desc"
//     } = req.query;

//     const pageNumber = parseInt(page);
//     const pageSize = parseInt(limit);

//     const skip = (pageNumber - 1) * pageSize;

//     // ================= FILTER BUILD =================
//     const filter = {
//       customerId
//     };

//     if (status) {
//       filter.status = status;
//     }

//     if (startDate || endDate) {
//       filter.createdAt = {};
//       if (startDate) {
//         filter.createdAt.$gte = new Date(startDate);
//       }
//       if (endDate) {
//         filter.createdAt.$lte = new Date(endDate);
//       }
//     }

//     if (search) {
//   filter.$or = [
//     { rmOrderId: { $regex: search, $options: "i" } },
//     { status: { $regex: search, $options: "i" } }
//   ];
// }

//     // ================= SORT =================
//     const sortOptions = {
//       [sortBy]: sortOrder === "asc" ? 1 : -1
//     };

//     // ================= QUERY =================
//     const [orders, total] = await Promise.all([
//       Order.find(filter)
//         .populate("store", "name")
//         .sort(sortOptions)
//         .skip(skip)
//         .limit(pageSize)
//         .lean(),

//       Order.countDocuments(filter)
//     ]);

//     return res.status(200).json({
//       success: true,
//       message: "Orders fetched successfully",
//       pagination: {
//         total,
//         page: pageNumber,
//         limit: pageSize,
//         totalPages: Math.ceil(total / pageSize)
//       },
//       orders
//     });

//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Failed to fetch orders"
//     });
//   }
// };