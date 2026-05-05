import Order from "../models/Order.model.js";
import Store from "../models/Store.model.js";
import Customer from "../models/User.model.js";
import Counter from "../models/Counter.model.js";
import Coupon from "../models/Coupon.model.js";
import Joi from "joi";
import { USER_ROLE, ORDER_STATUS } from "../constants/enums.js";
import { generateRMId } from "../utils/rmId.js";
import { buildStoreFilter, getUserStoreRole } from "../utils/accessHelper.js";

// ================== Joi Validation ==================
const createOrderSchema = Joi.object({
  store: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      productName: Joi.string().required(),
      variantLabel: Joi.string(),
      sellingPrice: Joi.number().positive().required(),
      qty: Joi.number().integer().min(1).required(),
      gstPercent: Joi.number()
    })
  ).min(1).required(),

  deliveryAddress: Joi.object({
    fullAddress: Joi.string().required(),
    city: Joi.string().required(),
    pincode: Joi.string().required(),
    latitude: Joi.number(),
    longitude: Joi.number()
  }).required(),

  deliveryDate: Joi.date().optional(),
  deliverySlot: Joi.string().optional(),

  paymentMethod: Joi.string().valid("COD", "ONLINE", "WALLET", "UPI").default("COD"),

  couponCode: Joi.string().optional()
});

const updateOrderSchema = Joi.object({
  status: Joi.string().valid(...Object.values(ORDER_STATUS)),
  couponCode: Joi.string().optional()
}).min(1);

const orderListSchema = Joi.object({
  page: Joi.number().default(1),
  limit: Joi.number().default(10),

  status: Joi.optional().allow(" "),
  store: Joi.string().optional().allow(''),
  customer: Joi.string().optional(),
  search: Joi.string().optional(),

  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  deliveryStartDate: Joi.date().optional(),
  deliveryEndDate: Joi.date().optional(),
});

// ----------------- Sequence Generator -----------------
// const getNextSequence = async (name) => {
//   const counter = await Counter.findByIdAndUpdate(
//     name,
//     { $inc: { seq: 1 } },
//     { new: true, upsert: true, setDefaultsOnInsert: true }
//   );
//   return counter.seq;
// };

// ================== CREATE ORDER ==================
export const createOrder = async (req, res) => {
  try {
    const { user, allowedStores } = req;

    if (!user.roles.includes(USER_ROLE.CUSTOMER))
      return res.status(403).json({ message: "Only customers can place orders" });

    const { error, value } = createOrderSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    if (!allowedStores.includes(value.store) && !user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      return res.status(403).json({ message: "Access denied to this store" });
    }

    const store = await Store.findById(value.store);
    if (!store) return res.status(404).json({ message: "Store not found" });

    let totalAmount = value.items.reduce((sum, i) => sum + i.sellingPrice * i.qty, 0);
    let gstAmount = value.items.reduce(
      (sum, i) => sum + (i.sellingPrice * i.qty * (i.gstPercent || 0)) / 100,
      0
    );

    let discountAmount = 0;
    if (value.couponCode) {
      const coupon = await Coupon.findOne({ code: value.couponCode.toUpperCase(), status: "ACTIVE" });
      if (!coupon) return res.status(400).json({ message: "Invalid or inactive coupon" });

      if (totalAmount < coupon.minOrderAmount) {
        return res.status(400).json({ message: `Order does not meet minimum amount for coupon` });
      }

      discountAmount =
        coupon.type === "FLAT"
          ? coupon.value
          : Math.min((totalAmount * coupon.value) / 100, coupon.maxDiscountAmount || Infinity);

      coupon.usedCount = (coupon.usedCount || 0) + 1;
      if (coupon.usageLimit && coupon.usedCount > coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit exceeded" });
      }
      await coupon.save();
    }

    const payableAmount = totalAmount + gstAmount - discountAmount;
   
    const rmOrderId = generateRMId("ORD", "ORDER");

    const order = await Order.create({
  ...value,
  rmOrderId,
  customer: user._id,
  totalAmount,
  gstAmount,
  discountAmount,
  couponCode: value.couponCode?.toUpperCase() || null,
  payableAmount,
  status: ORDER_STATUS.PLACED
});

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("createOrder:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log("req user",req.user)

    // Validate request body — sirf status hi allowed
    const { error, value } = updateOrderSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Find order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Check if user belongs to the store or has FULL_ACCESS
    const role = await getUserStoreRole(req.user, order.store);
    if (!role) return res.status(403).json({ message: "No access" });

    // Update only status
    if (value.status) order.status = value.status;
    else return res.status(400).json({ message: "Status is required" });

    await order.save();

    res.json({ success: true, order });

  } catch (err) {
    console.error("updateOrder:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================== GET ORDER BY ID ==================
export const getOrderById = async (req, res) => {
  try {
    const { user, allowedStores } = req;
    const order = await Order.findById(req.params.orderId)
      .populate("customer", "fullName email mobile")
      .populate("store", "storeName");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isCustomerOwner = user.roles.includes(USER_ROLE.CUSTOMER) && order.customer._id.toString() === user._id.toString();
    const hasStoreAccess = allowedStores.includes(order.store._id.toString());
    if (!user.roles.includes(USER_ROLE.SUPER_ADMIN) && !isCustomerOwner && !hasStoreAccess)
      return res.status(403).json({ message: "Access denied" });

    res.json({ success: true, order });
  } catch (err) {
    console.error("getOrderById:", err);
    res.status(500).json({ message: "Server error" });
  }
};



// ================== GET ALL ORDERS ==================
export const getAllOrders = async (req, res) => {
  try {
    const user = req.user;

    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      store,
      customer,
      category,
      startDate,
      endDate,
      deliveryStartDate,
      deliveryEndDate,
    } = req.query;

    let filter = {};

    // ================= STORE ACCESS =================
    const accessFilter = await buildStoreFilter(user, {
      field: "store",
      storeId: req.query.store,
    });

    if (store && store.trim() !== "") {
      filter.store = store;
    }

    filter = {
      ...filter,
      ...accessFilter,
    };

    // ================= OPTIONAL FILTERS =================
    if (status && status.trim() !== "") {
      filter.status = status;
    }

    if (customer && customer.trim() !== "") {
      filter.customer = customer;
    }

    if (category && category.trim() !== "") {
      filter.category = category;
    }

    // ================= CREATED DATE FILTER =================
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        filter.createdAt.$lte = end;
      }
    }

    // ================= DELIVERY DATE FILTER =================
    if (deliveryStartDate || deliveryEndDate) {
      filter.deliveryDate = {};

      if (deliveryStartDate) {
        filter.deliveryDate.$gte = new Date(deliveryStartDate);
      }

      if (deliveryEndDate) {
        const end = new Date(deliveryEndDate);
        end.setHours(23, 59, 59, 999);

        filter.deliveryDate.$lte = end;
      }
    }

    // ================= SEARCH FILTER =================
    if (search && search.trim() !== "") {
      const regex = new RegExp(search, "i");

      filter.$or = [
        { rmOrderId: regex },
        { paymentStatus: regex },
        { status: regex },

        // total / payable amount search
        {
          totalAmount: !isNaN(search) ? Number(search) : -1,
        },
        {
          payableAmount: !isNaN(search) ? Number(search) : -1,
        },
      ];
    }

    // ================= TOTAL COUNTS =================
    const totalOrders = await Order.countDocuments(filter);

    // ================= TOTAL REVENUE =================
    const totalRevenueAgg = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$payableAmount" },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;
    const totalAmount = totalRevenueAgg[0]?.totalAmount || 0;

    // ================= ORDERS =================
    const orders = await Order.find(filter)
      .populate({
        path: "customerId",
        select: "fullName mobile email",
        match:
          search && search.trim() !== ""
            ? {
                $or: [
                  { fullName: { $regex: search, $options: "i" } },
                  { mobile: { $regex: search, $options: "i" } },
                  { email: { $regex: search, $options: "i" } },
                ],
              }
            : {},
      })
      .populate("store", "_id storeName address")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // remove unmatched populated customer search
    const filteredOrders =
      search && search.trim() !== ""
        ? orders.filter(
            (o) =>
              o.customerId ||
              o.rmOrderId?.match(new RegExp(search, "i")) ||
              o.status?.match(new RegExp(search, "i")) ||
              o.paymentStatus?.match(new RegExp(search, "i")) ||
              o.totalAmount === Number(search) ||
              o.payableAmount === Number(search)
          )
        : orders;

    // ================= STATUS SUMMARY =================
    const summaryFilter = { ...filter };
    delete summaryFilter.status;

    const statusAgg = await Order.aggregate([
      { $match: summaryFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const allStatuses = Object.values(ORDER_STATUS);

    const statusSummary = allStatuses.map((st) => {
      const found = statusAgg.find((s) => s._id === st);

      return {
        status: st,
        totalOrders: found?.count || 0,
      };
    });

    res.json({
      success: true,
      totalOrders,
      totalAmount,
      totalRevenue,
      page: Number(page),
      limit: Number(limit),
      statusSummary,
      orders: filteredOrders,
    });
  } catch (err) {
    console.error("getAllOrders:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
};
// export const getAllOrders = async (req, res) => {
//   try {
//     const user = req.user;


//     const {
//       page = 1,
//       limit = 10,
//       status,
//       store,
//       customer,
//       category,
//       startDate,
//       endDate,
//       deliveryStartDate,
//       deliveryEndDate,
//     } = req.query;

//        let filter = {};



//       const accessFilter = await buildStoreFilter(user, {
//   field: "store",
//   storeId: req.query.store
// });

//     // agar specific store bhi pass hua hai
//     if (store && store.trim() !== "") {
//       filter.store = store;
//     }

//     // 🔥 MERGE BOTH (IMPORTANT)
//     filter = {
//       ...filter,
//       ...accessFilter,
//     };

//     // ===== Optional Filters =====
//     if (status && status.trim() !== "") filter.status = status;

//     if (customer && customer.trim() !== "") filter.customer = customer;
//     if (category && category.trim() !== "") filter.category = category;

//     // ===== Created Date Filter =====
//     if (startDate || endDate) {
//       filter.createdAt = {};
//       if (startDate) filter.createdAt.$gte = new Date(startDate);
//       if (endDate) filter.createdAt.$lte = new Date(endDate);
//     }

//     // ===== Delivery Date Filter =====
//     if (deliveryStartDate || deliveryEndDate) {
//       filter.deliveryDate = {};
//       if (deliveryStartDate) filter.deliveryDate.$gte = new Date(deliveryStartDate);
//       if (deliveryEndDate) filter.deliveryDate.$lte = new Date(deliveryEndDate);
//     }

//     // ================= TOTAL COUNTS =================
//     const totalOrders = await Order.countDocuments(filter);

//     const totalRevenueAgg = await Order.aggregate([
//       { $match: filter },
//       {
//         $group: {
//           _id: null,
//           totalRevenue: { $sum: "$payableAmount" },
//           totalAmount: { $sum: "$totalAmount" },
//         },
//       },
//     ]);

//     const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;
//     const totalAmount = totalRevenueAgg[0]?.totalAmount || 0;

//     // ================= PAGINATED ORDERS =================
//     const orders = await Order.find(filter)
//       .populate("customerId", "fullName mobile email")
//       .populate("store", "storeName address")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit);

//     // ================= STATUS SUMMARY =================
//     const statusAgg = await Order.aggregate([
//       { $match: filter },
//       {
//         $group: {
//           _id: "$status",
//           count: { $sum: 1 },
//         },
//       },
//     ]);

//     // ✅ Ensure all statuses show even if 0 count
//     const allStatuses = Object.values(ORDER_STATUS);
//     const statusSummary = allStatuses.map((st) => {
//       const found = statusAgg.find((s) => s._id === st);
//       return {
//         status: st,
//         totalOrders: found?.count || 0,
//       };
//     });

//     res.json({
//       success: true,
//       totalOrders,
//       totalAmount,
//       totalRevenue,
//       page: Number(page),
//       limit: Number(limit),
//       statusSummary,
//       orders,
//     });
//   } catch (err) {
//     console.error("getAllOrders:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// ================== DELETE ORDER ==================
export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).select("store");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const role = await getUserStoreRole(req.user, order.store);

    if (!role) { 
      return res.status(403).json({ message: "No access" });
    }

    // Allow FULL_ACCESS too
    if (!["OWNER", "MANAGER", "FULL_ACCESS"].includes(role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await order.deleteOne();
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error("deleteOrder:", err);
    res.status(500).json({ message: "Server error" });
  }
};