
import Joi from "joi";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import { generateRMId, generateTransactionId } from "../utils/rmId.js";
import CartModel from "../models/Cart.model.js";
import { customerValidator } from "../validations/customer.validator.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import { ORDER_STATUS } from "../constants/enums.js";
import { formatCart, formatProduct } from "../utils/formatProduct.js";
import ProductModel from "../models/Product.model.js";
import CouponModel from "../models/Coupon.model.js";
import CouponUsageModel from "../models/CouponUsage.model.js";
import OrderModel from "../models/Order.model.js";
import UserModel from "../models/User.model.js";
import cloudinary from "../config/cloudinaryConfig.js";

// ✅ Validation Schemas
const addressSchema = Joi.object({
  mobile: Joi.string().required(),
  _id: Joi.string().optional(),
  addressLine: Joi.string().required(),
  fullAddress: Joi.string().optional(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  pincode: Joi.string().required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  isDefault: Joi.boolean().optional(),
});

const customerSchema = Joi.object({
  fullName: Joi.string().required(),
  mobile: Joi.string().required(),
  email: Joi.string().email().optional(),
  isBlocked: Joi.boolean().optional(),
  addresses: Joi.array().items(addressSchema).optional(),
});

const orderListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(ORDER_STATUS)).optional(),
});


// ==================== CONTROLLER FUNCTIONS ====================

// Create Customer
// export const createCustomer = async (req, res) => {
//   try {
//     const { error, value } = customerSchema.validate(req.body);
//     if (error) return res.status(400).json({ success: false, message: error.message });


    
//     value.rmCustomerId = await generateRMId("RMCU",'CUSTOMER'); // generate here

//     const customer = new Customer(value);
//     await customer.save();

//     res.json({ success: true, customer });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };



// export const createCustomer = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // ✅ Validate Request Body
//     const { error, value } = customerValidator.validate(req.body);
//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: error.details?.[0]?.message || error.message,
//       });
//     }

//     const { name, mobile, email, password } = value;

//     // ✅ Check Duplicate User
//     const existing = await Customer.findOne(
//       { $or: [{ mobile }, { email }] },
//       null,
//       { session }
//     );

//     if (existing) {
//       return res.status(409).json({
//         success: false,
//         message: "Customer already exists",
//       });
//     }

    
//     // 🔐 Hash Password
//     const hashedPassword = await bcrypt.hash(password, 12);

//     // 🆔 Generate RM Customer ID
//     const rmCustomerId = await generateRMId("RMCU", "CUSTOMER");

//     // ✅ Create Customer
//     const customer = await Customer.create(
//       [
//         {
//           fullName:name,
//           mobile,
//           email,
//           password: hashedPassword,
//           rmCustomerId,
//           role: "CUSTOMER",
//         },
//       ],
//       { session }
//     );

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(201).json({
//       success: true,
//       message: "Customer created successfully",
//       customer: {
//         id: customer[0]._id,
//         rmCustomerId: customer[0].rmCustomerId,
//         fullName: customer[0].fullName,
//         mobile: customer[0].mobile,
//         email: customer[0].email,
//       },
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Create Customer Error:", err);

//     // Duplicate Key Error Handler
//     if (err.code === 11000) {
//       return res.status(409).json({
//         success: false,
//         message: "Duplicate field error",
//         key: err.keyValue,
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };



// export const customerLogin = async (req, res) => {
//   try {
//     const { mobile, email, password } = req.body;

//     if ((!mobile && !email) || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile or Email and Password required",
//       });
//     }

// const query = [];

// if (mobile) query.push({ mobile });
// if (email) query.push({ email });

// const customer = await Customer.findOne({
//   $or: query,
// }).select("+password");

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         message: "Customer not found",
//       });
//     }

//     if (customer.isBlocked) {
//       return res.status(403).json({
//         success: false,
//         message: "Account blocked",
//       });
//     }

//     // Password check
//     const isMatch = await bcrypt.compare(password, customer.password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid password",
//       });
//     }

//     // Token payload
//     const payload = {
//       id: customer._id,
//       role: "CUSTOMER",
//       mobile: customer.mobile,
//       email: customer.email,
//     };

//     const tokens = generateToken(payload);

//     // Save refresh token
//     customer.refreshToken = tokens.refreshToken;
//     await customer.save();

//     // Remove password before sending response
//     const userData = customer.toObject();
//     delete userData.password;

//     return res.json({
//       success: true,
//       message: "Login successful",
//       tokens,
//       user: userData,
//     });
//   } catch (err) {
//     console.error("Login Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


// controllers/customerAuth.controller.js


// export const createCustomer = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { error, value } = customerValidator.validate(req.body);
//     if (error)
//       return res.status(400).json({ success: false, message: error.message });

//     const { name, mobile, email, password, guestCart } = value;

//     const existing = await Customer.findOne(
//       { $or: [{ mobile }, { email }] },
//       null,
//       { session }
//     );

//     if (existing)
//       return res.status(409).json({
//         success: false,
//         message: "Customer already exists",
//       });

//     const hashedPassword = await bcrypt.hash(password, 12);
//     const rmCustomerId = await generateRMId("RMCU", "CUSTOMER");

//     const customer = await Customer.create(
//       [
//         {
//           fullName: name,
//           mobile,
//           email,
//           password: hashedPassword,
//           rmCustomerId,
//           role: "CUSTOMER",
//         },
//       ],
//       { session }
//     );

//     // 🔥 CREATE CART
//     const cart = await CartModel.create(
//       [
//         {
//           customer: customer[0]._id,
//           items: [],
//         },
//       ],
//       { session }
//     );

//     // 🔥 MERGE GUEST CART IF EXISTS
//     if (guestCart && guestCart.length > 0) {
//       guestCart.forEach((gItem) => {
//         cart[0].items.push({
//           product: gItem.productId,
//           variantId: gItem.variantId,
//           qty: gItem.qty,
//         });
//       });

//       await cart[0].save({ session });
//     }

//     await session.commitTransaction();
//     session.endSession();

//     // 🔥 Populate before sending
//     await cart[0].populate({
//       path: "items.product",
//       select: "name images variants gstPercent",
//     });

//     const formattedCart = cart[0].items.map((item) => {
//       const variant = item.product.variants.id(item.variantId);

//       return {
//         productId: item.product._id,
//         name: item.product.name,
//         image: item.product.images?.[0]?.url || "",
//         variantValue: variant?.value,
//         sellingPrice: variant?.sellingPrice,
//         mrp: variant?.mrp,
//         gstPercent: item.product.gstPercent,
//         qty: item.qty,
//       };
//     });

//     const payload = {
//       id: customer[0]._id,
//       role: "CUSTOMER",
//     };

//     const tokens = generateToken(payload);

//     return res.status(201).json({
//       success: true,
//       message: "Customer created successfully",
//       tokens,
//       user: customer[0],
//       cart: formattedCart, // 🔥 cart bhi bhej diya
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Create Customer Error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// export const createCustomer = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { error, value } = customerValidator.validate(req.body);
//     if (error) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: error.message });
//     }

//     const { name, mobile, email, password, guestCart = [] } = value;

//     const existing = await Customer.findOne(
//       { $or: [{ mobile }, { email }] },
//       null,
//       { session }
//     );

//     if (existing) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(409).json({
//         success: false,
//         message: "Customer already exists",
//       });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);
//     const rmCustomerId = await generateRMId("RMCU", "CUSTOMER");

//     const [customer] = await Customer.create(
//       [
//         {
//           fullName: name,
//           mobile,
//           email,
//           password: hashedPassword,
//           rmCustomerId,
//           role: "CUSTOMER",
//         },
//       ],
//       { session }
//     );

//     const [cart] = await CartModel.create(
//       [
//         {
//           customerId: customer._id,
//           items: [],
//         },
//       ],
//       { session }
//     );

//     // 🔥 Merge Guest Cart
//     for (const gItem of guestCart) {
//       cart.items.push({
//         productId: gItem.productId,
//         variantId: gItem.variantId,
//         qty: gItem.qty,
//       });
//     }

//     await cart.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     // 🔥 Populate correctly
//     await cart.populate({
//       path: "items.productId",
//       select: "name images variants gstPercent",
//     });

// //         await cart.populate({
// //   path: "items.productId",
// //   select: "name images variants gstPercent",
// // });

// // const formattedCart = cart.items.map((item) => {
// //   const product = item.productId;

// //   const variant = product?.variants?.find(
// //     (v) => v._id?.toString() === item.variantId?.toString()
// //   );

// //   return {
// //     productId: product?._id,
// //     variantId: item.variantId,
// //     name: product?.name || "",
// //     image: product?.images?.[0]?.url || "",
// //     variantValue: variant?.value || "",
// //     sellingPrice: variant?.sellingPrice || 0,
// //     mrp: variant?.mrp || 0,
// //     gstPercent: product?.gstPercent || 0,
// //     qty: item.qty || 0,
// //   };
// // });

//     const tokens = generateToken({
//       id: customer._id,
//       role: "CUSTOMER",
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Customer created successfully",
//       tokens,
//       user: customer,
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Create Customer Error:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//     });
//   }
// };

// export const createCustomer = async (req, res) => {
//   const session = await mongoose.startSession();
//   let transactionStarted = false;

//   try {
//     session.startTransaction();
//     transactionStarted = true;

//     const { error, value } = customerValidator.validate(req.body);
//     if (error) {
//       if (transactionStarted) await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: error.message });
//     }

//     const { name, mobile, email, password, guestCart = [] } = value;

//     const existing = await Customer.findOne(
//       { $or: [{ mobile }, { email }] },
//       null,
//       { session }
//     );

//     if (existing) {
//       if (transactionStarted) await session.abortTransaction();
//       session.endSession();
//       return res.status(409).json({ success: false, message: "Customer already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);
//     const rmCustomerId = await generateRMId("RMCU", "CUSTOMER");

//     const [customer] = await Customer.create([{ fullName: name, mobile, email, password: hashedPassword, rmCustomerId, role: "CUSTOMER" }], { session });
//     const [cart] = await CartModel.create([{ customerId: customer._id, items: [] }], { session });

//     // Merge guest cart
//     for (const gItem of guestCart) {
//       cart.items.push({ productId: gItem.productId, variantId: gItem.variantId, qty: gItem.qty });
//     }

//     await cart.save({ session });

//     await session.commitTransaction();
//     transactionStarted = false; // transaction committed
//     session.endSession();

//     await cart.populate({ path: "items.productId", select: "name images variants gstPercent slug" });

//     const tokens = generateToken({ id: customer._id, role: "CUSTOMER" });

//     return res.status(201).json({ success: true, message: "Customer created successfully", tokens, user: customer,
//        items: formatCart(cart),
//      });
//   } catch (err) {
//     if (transactionStarted) {
//       await session.abortTransaction();
//     }
//     session.endSession();
//     console.error("Create Customer Error:", err);
//     return res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };


// export const customerLogin = async (req, res) => {
//   try {
//     const { mobile, email, password, guestCart } = req.body;

//     if ((!mobile && !email) || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile or Email and Password required",
//       });
//     }

//     const query = [];
//     if (mobile) query.push({ mobile });
//     if (email) query.push({ email });

//     const customer = await Customer.findOne({ $or: query }).select("+password");

//     if (!customer)
//       return res.status(404).json({ success: false, message: "Customer not found" });

//     const isMatch = await bcrypt.compare(password, customer.password);
//     if (!isMatch)
//       return res.status(401).json({ success: false, message: "Invalid password" });

//     // 🔥 FIND OR CREATE CART
//     let cart = await CartModel.findOne({ customer: customer._id });

//     if (!cart) {
//       cart = await CartModel.create({
//         customer: customer._id,
//         items: [],
//       });
//     }

//     // 🔥 MERGE GUEST CART IF EXISTS
//     if (guestCart && guestCart.length > 0) {
//       guestCart.forEach((gItem) => {
//         const existingItem = cart.items.find(
//           (item) =>
//             item.productId.toString() === gItem.productId &&
//             item.variantId.toString() === gItem.variantId
//         );

//         if (existingItem) {
//           existingItem.qty += gItem.qty;
//         } else {
//           cart.items.push({
//             productId: gItem.productId,
//             variantId: gItem.variantId,
//             qty: gItem.qty,
//           });
//         }
//       });

//       await cart.save();
//     }

//     await cart.populate({
//       path: "items.product",
//       select: "name images variants gstPercent",
//     });

//     const formattedCart = cart.items.map((item) => {
//       const variant = item.product.variants.id(item.variantId);

//       return {
//         productId: item.product._id,
//         name: item.product.name,
//         image: item.product.images?.[0]?.url || "",
//         variantValue: variant?.value,
//         sellingPrice: variant?.sellingPrice,
//         mrp: variant?.mrp,
//         gstPercent: item.product.gstPercent,
//         qty: item.qty,
//       };
//     });

//     const payload = {
//       id: customer._id,
//       role: "CUSTOMER",
//     };

//     const tokens = generateToken(payload);

//     return res.json({
//       success: true,
//       message: "Login successful",
//       tokens,
//       user: customer,
//       cart: formattedCart, // 🔥 cart directly bhej diya
//     });
//   } catch (err) {
//     console.error("Login Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


export const createCustomer = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { error, value } =
      customerValidator.validate(req.body);

    if (error) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const {
      name,
      mobile,
      email,
      password,
      guestCart = [],
    } = value;

    // =========================
    // CHECK EXISTING
    // =========================

    const existing = await Customer.findOne(
      {
        $or: [{ mobile }, { email }],
      },
      null,
      { session }
    );

    if (existing) {
      await session.abortTransaction();

      return res.status(409).json({
        success: false,
        message:
          "Customer already exists",
      });
    }

    // =========================
    // HASH PASSWORD
    // =========================

    const hashedPassword =
      await bcrypt.hash(password, 12);

    const rmCustomerId =
      await generateRMId(
        "RMCU",
        "CUSTOMER"
      );

    // =========================
    // CREATE CUSTOMER
    // =========================

    const [customer] =
      await Customer.create(
        [
          {
            fullName: name,

            mobile,

            email,

            password: hashedPassword,

            rmCustomerId,

            role: "CUSTOMER",
          },
        ],
        { session }
      );

    // =========================
    // PREPARE CART ITEMS
    // =========================

    const cartItems = guestCart.map(
      (gItem) => ({
        productId: gItem.productId,

        variantId: gItem.variantId,

        qty: gItem.qty || 1,

        layer:
          gItem.layer || null,
      })
    );

    // =========================
    // CREATE CART
    // =========================

    const [cart] =
      await CartModel.create(
        [
          {
            customerId: customer._id,

            items: cartItems,
          },
        ],
        { session }
      );

    // =========================
    // COMMIT
    // =========================

    await session.commitTransaction();

    // =========================
    // POPULATE
    // =========================

    await cart.populate({
      path: "items.productId",

      select:
        "name images variants gstPercent slug customization",
    });

    // =========================
    // TOKEN
    // =========================

    const tokens = generateToken({
      id: customer._id,

      role: "CUSTOMER",
    });

    return res.status(201).json({
      success: true,

      message:
        "Customer created successfully",

      tokens,

      user: customer,

      items: formatCart(cart),
    });
  } catch (err) {
    await session.abortTransaction();

    console.error(
      "Create Customer Error:",
      err
    );

    return res.status(500).json({
      success: false,

      message:
        "Internal Server Error",
    });
  } finally {
    session.endSession();
  }
};

export const customerLogin = async (req, res) => {
  try {
    const {
      mobile,
      email,
      password,
      guestCart = [],
    } = req.body;

    // ─────────────────────────
    // VALIDATION
    // ─────────────────────────

    if ((!mobile && !email) || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile or Email and Password required",
      });
    }

    // ─────────────────────────
    // FIND CUSTOMER
    // ─────────────────────────

    const query = [];

    if (mobile) query.push({ mobile });

    if (email) query.push({ email });

    const customer = await Customer.findOne({
      $or: query,
    }).select("+password");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // ─────────────────────────
    // PASSWORD CHECK
    // ─────────────────────────

    const isMatch = await bcrypt.compare(
      password,
      customer.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // ─────────────────────────
    // BLOCK CHECK
    // ─────────────────────────

    if (customer.isBlocked) {
      return res.status(403).json({
        success: false,
        message:
          "🚫 Your account has been temporarily blocked by the admin. Please contact support for assistance.",
      });
    }

    // ─────────────────────────
    // GET / CREATE CART
    // ─────────────────────────

    let cart = await CartModel.findOne({
      customerId: customer._id,
    });

    if (!cart) {
      cart = await CartModel.create({
        customerId: customer._id,
        items: [],
      });
    }

    // ─────────────────────────
    // MERGE GUEST CART
    // SUPPORT CUSTOMIZATION
    // ─────────────────────────

    for (const gItem of guestCart) {
      const existingItem = cart.items.find(
        (item) =>
          item.productId.toString() ===
            gItem.productId &&
          item.variantId.toString() ===
            gItem.variantId &&
          (
            item?.layer?.layerId ||
            ""
          ) ===
            (
              gItem?.layer
                ?.layerId || ""
            )
      );

      // SAME ITEM
      if (existingItem) {
        existingItem.qty +=
          gItem.qty || 1;

        // update customization
        existingItem.layer =
          gItem.layer || null;
      }

      // NEW ITEM
      else {
        cart.items.push({
          productId: gItem.productId,

          variantId: gItem.variantId,

          qty: gItem.qty || 1,

          layer:
            gItem.layer || null,
        });
      }
    }

    // ─────────────────────────
    // SAVE CART
    // ─────────────────────────

    await cart.save();

    // ─────────────────────────
    // POPULATE PRODUCT
    // ─────────────────────────

    await cart.populate({
      path: "items.productId",

      select:
        "name images variants gstPercent slug customization",
    });

    // ─────────────────────────
    // TOKEN
    // ─────────────────────────

    const tokens = generateToken({
      id: customer._id,
      role: "CUSTOMER",
    });

    // remove password
    customer.password = undefined;

    // ─────────────────────────
    // RESPONSE
    // ─────────────────────────

    return res.status(200).json({
      success: true,

      message: "Login successful",

      tokens,

      user: customer,

      items: formatCart(cart),
    });
  } catch (err) {
    console.error("Login Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// export const customerLogin = async (req, res) => {
//   try {
//     const { mobile, email, password, guestCart = [] } = req.body;

//     console.log("get gestcart",guestCart)

//     if ((!mobile && !email) || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile or Email and Password required",
//       });
//     }

//     const query = [];
//     if (mobile) query.push({ mobile });
//     if (email) query.push({ email });

//     const customer = await Customer.findOne({ $or: query }).select("+password");

//     if (!customer)
//       return res.status(404).json({ success: false, message: "Customer not found" });

//     const isMatch = await bcrypt.compare(password, customer.password);
//     if (!isMatch)
//       return res.status(401).json({ success: false, message: "Invalid password" });

//     let cart = await CartModel.findOne({ customerId: customer._id });

//     if (!cart) {
//       cart = await CartModel.create({
//         customerId: customer._id,
//         items: [],
//       });
//     }

//     // 🔥 Merge Guest Cart Safely
//     for (const gItem of guestCart) {
//       const existingItem = cart.items.find(
//         (item) =>
//           item.productId?.toString() === gItem?.productId &&
//           item.variantId?.toString() === gItem.variantId
//       );

//       if (existingItem) {
//         existingItem.qty += gItem.qty;
//       } else {
//         cart.items.push({
//           productId: gItem.productId,
//           variantId: gItem.variantId,
//           qty: gItem.qty,
//         });
//       }
//     }

//     await cart.save();
// await cart.populate({
//   path: "items.productId",
//   select: "name images variants gstPercent slug",
// });



//     const tokens = generateToken({
//       id: customer._id,
//       role: "CUSTOMER",
//     });

//   return res.json({
//   success: true,
//   tokens,
//   user: customer,
//   items: formatCart(cart),
// });
//   } catch (err) {
//     console.error("Login Error:", err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };




export const customerLogout = async (req, res) => {
  try {
    const customer = req.customer; // middleware se aayega

    customer.refreshToken = null;
    await customer.save();

    return res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// 🔹 UPDATE PROFILE
export const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user?._id; // from auth middleware

    // console.log("the get the data in token",customerId)
    const { fullName, mobile } = req.body;

    console.log("fullname",fullName)
    console.log("mobile",mobile)
  

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }
   


    if (fullName) customer.fullName = fullName;
    if (mobile) customer.mobile = mobile;

    await customer.save();

     const userData = customer.toObject();
    delete userData.password;

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: userData,
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const deleteCustomerAddress =async (req, res) => {
  try {
    const customerId = req.user._id; // logged-in user
    const { addressId } = req.params;

    const customer = await Customer.findById(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // remove address by id
    customer.addresses = customer.addresses.filter(
      (addr) => addr._id.toString() !== addressId
    );

     await customer.save();

     const userData = customer.toObject();
    delete userData.password;

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: userData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}


// 🔹 CHANGE PASSWORD
export const changeCustomerPassword = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Old & New password required" });
    }

    const customer = await Customer.findById(customerId).select("+password");

    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password wrong" });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    customer.password = hashed;
    await customer.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Password Change Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Add Address
 */
// export const addAddress = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const {
//       fullAddress,
//       addressLine,
//       mobile,
//       city,
//       state,
//       pincode,
//       latitude,
//       longitude,
//       type,
//       isDefault,
//     } = req.body;

//     if (!latitude || !longitude) {
//       return res.status(400).json({
//         success: false,
//         message: "Latitude and Longitude required",
//       });
//     }

//     const customer = await Customer.findById(userId);
//     if (!customer)
//       return res.status(404).json({ success: false, message: "User not found" });

//     // ✅ If setting default, remove old default
//     if (isDefault) {
//       customer.addresses.forEach((addr) => (addr.isDefault = false));
//     }

//     customer.addresses.push({
//       fullAddress,
//       addressLine,
//       mobile,
//       city,
//       state,
//       pincode,
//       latitude,
//       longitude,
//       type,
//       isDefault: isDefault || false,
//       location: {
//         type: "Point",
//         coordinates: [longitude, latitude],
//       },
//     });

//     await customer.save();

//     return res.status(201).json({
//       success: true,
//       message: "Address added successfully",
//       user: customer,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

export const addAddress = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      fullAddress,
      addressLine,
      mobile,
      city,
      state,
      pincode,
      latitude,
      longitude,
      type,
      isDefault,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude required",
      });
    }

    const customer = await Customer.findById(userId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ CHECK EXISTING ADDRESS
    const existingAddress = customer.addresses.find((addr) => {
      return (
        addr.fullAddress === fullAddress &&
        addr.addressLine === addressLine &&
        addr.mobile === mobile &&
        addr.city === city &&
        addr.state === state &&
        addr.pincode === pincode &&
        addr.type === type
      );
    });

    if (existingAddress) {
      return res.status(200).json({
        success: true,
        message: "Address already exists",
        isNewAddress: false,
      });
    }

    // ✅ If setting default, remove old default
    if (isDefault) {
      customer.addresses.forEach((addr) => (addr.isDefault = false));
    }

    // ✅ ADD NEW ADDRESS
    customer.addresses.push({
      fullAddress,
      addressLine,
      mobile,
      city,
      state,
      pincode,
      latitude,
      longitude,
      type,
      isDefault: isDefault || false,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });

    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      isNewAddress: true,
      user: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * ✅ Update Address
 */
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;

    console.log("get the data",addressId)

    const {
      fullAddress,
      addressLine,
      mobile,
      city,
      state,
      pincode,
      latitude,
      longitude,
      type,
      isDefault,
    } = req.body;

    const customer = await Customer.findById(userId);
    if (!customer)
      return res.status(404).json({ success: false, message: "User not found" });

    const address = customer.addresses.id(addressId);
        console.log("get the data of address",addAddress)
        console.log("get the data",addressId)
    if (!address)
      return res.status(404).json({ success: false, message: "Address not found" });

    // ✅ If default is being changed
    if (isDefault) {
      customer.addresses.forEach((addr) => (addr.isDefault = false));
    }

    address.fullAddress = fullAddress ?? address.fullAddress;
    address.addressLine = addressLine ?? address.addressLine;
    address.mobile = mobile ?? address.mobile;
    address.city = city ?? address.city;
    address.state = state ?? address.state;
    address.pincode = pincode ?? address.pincode;
    address.type = type ?? address.type;
    address.isDefault = isDefault ?? address.isDefault;

    if (latitude && longitude) {
      address.latitude = latitude;
      address.longitude = longitude;
      address.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      user: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const updateCustomerDp = async (req, res) => {
  try {
    const userId = req.user._id; // authMiddleware should set req.user


    const user = await Customer.findById(userId).select("+password");

    if (!user) return res.status(404).json({ message: "User not found" });



 
console.log("TYPE:", typeof req.body.dp);
console.log("BODY:", req.body);
console.log("FILE:", req.file);
    // ---------------- Update Profile Image ----------------
    if (req.file) {
      // delete old image from cloudinary if exists
      if (user.dp && user.dp.public_id) {
        await cloudinary.uploader.destroy(user.dp.public_id);
      }

      // upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "user_dp",
        width: 300,
        height: 300,
        crop: "fill",
      });

      user.dp = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    await user.save();

    // return updated user (exclude passwordHash)
    const { password, ...userData } = user.toObject();

    res.json({ success: true, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Update failed" });
  }
};

/**
 * ✅ Delete Address
 */
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;

    const customer = await Customer.findById(userId);
    if (!customer)
      return res.status(404).json({ success: false, message: "User not found" });

    const address = customer.addresses.id(addressId);
    if (!address)
      return res.status(404).json({ success: false, message: "Address not found" });

    address.remove();

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      user: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ✅ Set Default Address
 */
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { addressId } = req.params;

    const customer = await Customer.findById(userId);
    if (!customer)
      return res.status(404).json({ success: false, message: "User not found" });

    const address = customer.addresses.id(addressId);
    if (!address)
      return res.status(404).json({ success: false, message: "Address not found" });

    // Remove old default
    customer.addresses.forEach((addr) => (addr.isDefault = false));

    address.isDefault = true;

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Default address updated",
      user: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const getAllCustomers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search, isBlocked } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (isBlocked === "true") query.isBlocked = true;
    if (isBlocked === "false") query.isBlocked = false;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid customer ID" });

    const { error, value } = customerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const updatedCustomer = await Customer.findByIdAndUpdate(id, value, { new: true });
    if (!updatedCustomer) return res.status(404).json({ success: false, message: "Customer not found" });

    res.json({ success: true, customer: updatedCustomer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid customer ID" });

    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) return res.status(404).json({ success: false, message: "Customer not found" });

    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Pagination & filter for orders


// ------------------- Profile -------------------

// Get own profile
export const getProfile = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id).select("-passwordHash -refreshToken");
    res.json({ success: true, customer: user });
  } catch (err) {
    console.error("getProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await Customer.findByIdAndUpdate(req.user._id, value, { new: true }).select("-passwordHash -refreshToken");
    res.json({ success: true, customer: user });
  } catch (err) {
    console.error("updateProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Cart -------------------

// Get cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id }).populate("items.product");
    res.json({ success: true, cart });
  } catch (err) {
    console.error("getCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add / Update item in cart
export const addToCart = async (req, res) => {
  try {
    const schema = Joi.object({
      product: Joi.string().required(),
      variantId: Joi.string().required(),
      qty: Joi.number().integer().min(1).required(),
    });

    const { error, value } = schema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    let cart = await CartModel.findOne({ customer: req.user._id });

    if (!cart) {
      cart = await CartModel.create({
        customer: req.user._id,
        items: [
          {
            product: value.product,
            variantId: value.variantId,
            qty: value.qty,
          },
        ],
      });
    } else {
      const existingItem = cart.items.find(
        (i) =>
          i.product.toString() === value.product &&
          i.variantId === value.variantId
      );

      if (existingItem) {
        // ✅ SAME PRODUCT + SAME VARIANT → increase qty
        existingItem.qty += value.qty;
      } else {
        cart.items.push({
          product: value.product,
          variantId: value.variantId,
          qty: value.qty,
        });
      }

      await cart.save();
    }

    cart = await cart.populate("items.product");

    res.json({ success: true, cart });
  } catch (err) {
    console.error("addToCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const schema = Joi.object({
      product: Joi.string().required(),
      variantLabel: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      i => !(i.product.toString() === value.product && i.variantLabel === value.variantLabel)
    );

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("removeFromCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await CartModel.findOne({ customer: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("clearCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Customer Orders -------------------
export const getCustomerOrders = async (req, res) => {
  try {
    const { error, value } = orderListSchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { page, limit, status } = value;
    const filter = { customer: req.user._id };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("store", "storeName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, page, limit, orders });
  } catch (err) {
    console.error("getCustomerOrders:", err);
    res.status(500).json({ message: "Server error" });
  }
};


export const toggleCustomerStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await Customer.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Toggle the isBlocked status
    user.isBlocked = !user.isBlocked;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User has been ${user.isBlocked ? "blocked" : "unblocked"}`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        isBlocked: user.isBlocked,
      },
    });

  } catch (err) {
    console.error("TOGGLE STATUS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not toggle status",
    });
  }
};



// ------------------- Optional: Get Single Cart -------------------
export const getCartById = async (req, res) => {
  try {
    const { cartId } = req.params;

    const cart = await CartModel.findById(cartId)
      .populate({
        path: "customer",
        select: "fullName email mobile",
      })
      .populate({
        path: "items.product",
        select: "name sellingPrice images gstPercent",
      });

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    res.json({ success: true, cart });
  } catch (err) {
    console.error("getCartById:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ------------------- Get All Carts (Admin) -------------------


export const getAllCarts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const customerFilter = req.query.customer || "";

    const skip = (page - 1) * limit;
    const query = {};

    

    if (customerFilter && mongoose.Types.ObjectId.isValid(customerFilter)) {
      query.customerId = new mongoose.Types.ObjectId(customerFilter);
    }

    if (search) {
      const customers = await Customer.find({
        fullName: { $regex: search, $options: "i" },
      }).select("_id");

      const customerIds = customers.map((c) => c._id);

      query.$or = [{ customerId: { $in: customerIds } }];
    }

    const totalCarts = await CartModel.countDocuments(query);


query.items = { $exists: true, $ne: [] };
    const cartsRaw = await CartModel.find(query)
      .populate({
        path: "customerId",
        select: "_id fullName email mobile",
      })
      .populate({
        path: "items.productId",
        select: "name variants images gstPercent",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // ✅ Proper total calculation with variant
    const carts = cartsRaw.map((cart) => {
      let totalAmount = 0;

      const updatedItems = cart.items.map((item) => {
        const product = item.productId;

        const variant = product?.variants?.find(
          (v) => v._id.toString() === item.variantId.toString()
        );

        const price = variant?.sellingPrice || 0;
        const subtotal = price * item.qty;

        totalAmount += subtotal;

        return {
          ...item.toObject(),
          price,
          subtotal,
        };
      });

      return {
        ...cart.toObject(),
        items: updatedItems,
        totalAmount,
      };
    });

    const allCustomers = await Customer.find().select("_id fullName");

    res.status(200).json({
      success: true,
      totalCarts,
      page,
      limit,
      totalPages: Math.ceil(totalCarts / limit),
      carts,
      customers: allCustomers,
    });
  } catch (err) {
    console.error("getAllCarts:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



// Clear Cart By CustomerId 

export const clearCartByAdmin = async (req, res) => {
  try {
    const customerId = req.params.id;

    // console.log("get the customer data", customerId);


    await CartModel.findOneAndUpdate(
      { customerId },
      { items: [] }
    );

    return res.json({
      success: true,
      message :"Cart is Cleared",
      items: [],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// export const createOrder = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const customerId = req.user._id;

//     const {
//       couponCode,
//       paymentMethod = "COD",
//       deliveryAddress,
//       deliverySlot,
//       notes,
//     } = req.body;

//     // ================= VALIDATE ADDRESS =================
//     if (!deliveryAddress || !deliveryAddress.fullAddress || !deliveryAddress.city || !deliveryAddress.pincode) {
//       throw new Error("Valid delivery address required");
//     }

//     // ================= GET CART =================
//     const cart = await CartModel.findOne({ customerId }).session(session);

//     if (!cart || cart.items.length === 0) {
//       throw new Error("Cart is empty");
//     }

//     let totalAmount = 0;     // without GST
//     let gstAmount = 0;
//     let discountAmount = 0;
//     let storeId = null;

//     const orderItems = [];

//     // ================= VALIDATE PRODUCTS =================
//     for (const item of cart.items) {
//       const product = await ProductModel.findById(item.productId).session(session);

//       if (!product) {
//         throw new Error("Product not found");
//       }

//       if (!storeId) {
//         storeId = product.store;
//       }

//       // 🔥 Find Variant properly
//       const variant = product.variants.find(
//         v => v._id.toString() === item.variantId.toString()
//       );

//       if (!variant || !variant.isActive) {
//         throw new Error("Variant not available");
//       }

//       if (variant.stockQty < item.qty) {
//         throw new Error(`Insufficient stock for ${product.name}`);
//       }

//       const itemBaseTotal = variant.sellingPrice * item.qty;
//       const itemGST = (itemBaseTotal * (product.gstPercent || 0)) / 100;

//       totalAmount += itemBaseTotal;
//       gstAmount += itemGST;

//       orderItems.push({
//         productName: product.name,
//         variantLabel: `${product.label}: ${variant.value}`,
//         sellingPrice: variant.sellingPrice,
//         qty: item.qty,
//         gstPercent: product.gstPercent || 0
//       });

//       // 🔥 Reduce Stock
//       variant.stockQty -= item.qty;
//       await product.save({ session });
//     }

//     // ================= APPLY COUPON =================
//     if (couponCode) {
//       const coupon = await CouponModel.findOne({
//         code: couponCode.toUpperCase(),
//         status: "ACTIVE"
//       }).session(session);

//       if (!coupon) throw new Error("Invalid coupon");

//       const now = new Date();

//       if (now < coupon.startDate || now > coupon.endDate)
//         throw new Error("Coupon expired");

//       if (totalAmount < coupon.minOrderAmount)
//         throw new Error("Minimum order amount not reached");

//       if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
//         throw new Error("Coupon usage limit reached");

//       // 🔥 One user one time check
//       const alreadyUsed = await CouponUsage.findOne({
//         coupon: coupon._id,
//         user: customerId
//       }).session(session);

//       if (alreadyUsed)
//         throw new Error("You already used this coupon");

//       // 🔥 Calculate Discount
//       if (coupon.type === "PERCENTAGE") {
//         discountAmount = (totalAmount * coupon.value) / 100;

//         if (coupon.maxDiscountAmount) {
//           discountAmount = Math.min(
//             discountAmount,
//             coupon.maxDiscountAmount
//           );
//         }
//       } else {
//         discountAmount = coupon.value;
//       }

//       // Prevent negative payable
//       if (discountAmount > totalAmount) {
//         discountAmount = totalAmount;
//       }

//       // 🔥 Save usage record
//       const usage = await CouponUsageModel.create(
//         [
//           {
//             coupon: coupon._id,
//             user: customerId
//           }
//         ],
//         { session }
//       );

//       // increase used count
//       coupon.usedCount += 1;
//       await coupon.save({ session });
//     }

//     // ================= FINAL PAYABLE =================
//     const payableAmount = totalAmount + gstAmount - discountAmount;

//     if (payableAmount < 0) {
//       throw new Error("Invalid payable amount calculation");
//     }

//     const rmOrderId = await generateRMId("ORD","ORDER")
//     const transactionId = generateTransactionId() || null
//     // ================= CREATE ORDER =================
//     const order = await OrderModel.create(
//       [
//         {
//           customer: customerId,
//           rmOrderId,
//           store: storeId,
//           items: orderItems,
//           totalAmount,
//           gstAmount,
//           discountAmount,
//           payableAmount,
//           couponCode: couponCode || null,
//           paymentMethod,
//           transactionId,
//           paymentStatus:
//             paymentMethod === "COD"
//               ? "PENDING"
//               : "PENDING",
//           deliveryAddress,
//           deliverySlot,
//           notes,
//           status: ORDER_STATUS.PLACED
//         }
//       ],
//       { session }
//     );

//     // 🔥 Attach order to coupon usage (optional but clean)
//     if (couponCode) {
//       await CouponUsageModel.updateOne(
//         { user: customerId, order: { $exists: false } },
//         { order: order[0]._id },
//         { session }
//       );
//     }

//     // ================= CLEAR CART =================
//     cart.items = [];
//     await cart.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     return res.status(201).json({
//       success: true,
//       message: "Order placed successfully",
//       order: order[0]
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     return res.status(400).json({
//       success: false,
//       message: error.message || "Order creation failed"
//     });
//   }
// };