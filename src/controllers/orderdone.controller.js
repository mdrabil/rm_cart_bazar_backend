import Order from "../models/Order.model.js";
import Store from "../models/Store.model.js";
import Customer from "../models/User.model.js"; // assuming Customer is a User with CUSTOMER role
import Joi from "joi";
import { USER_ROLE, ORDER_STATUS } from "../constants/enums.js";

// 🔹 Joi Validation
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
  }).required()
});

const updateOrderSchema = Joi.object({
  status: Joi.string().valid(...Object.values(ORDER_STATUS))
}).min(1);

const orderListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(ORDER_STATUS)).optional(),
  store: Joi.string().optional(),
  customer: Joi.string().optional()
});
// 🔹 Helper: check access to order
const checkOrderAccess = async (user, order, staffRoleStoreId, staffRole) => {
  if (user.roles.includes(USER_ROLE.SUPER_ADMIN)) return true;

  // Vendor: only their store
  if (user.roles.includes(USER_ROLE.VENDOR) && order.store.toString() === staffRoleStoreId?.toString()) return true;

  // Manager / Chef: only assigned store
  if ([USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some(r => user.roles.includes(r)) && order.store.toString() === staffRoleStoreId?.toString()) return true;

  // Customer: only own orders
  if (user.roles.includes(USER_ROLE.CUSTOMER) && order.customer.toString() === user._id.toString()) return true;

  return false;
};

// 🔹 CREATE ORDER (Customer only)
export const createOrder = async (req, res) => {
  try {
    if (!req.user.roles.includes(USER_ROLE.CUSTOMER)) {
      return res.status(403).json({ message: "Only customers can place orders" });
    }

    const { error, value } = createOrderSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Check store exists
    const store = await Store.findById(value.store);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const totalAmount = value.items.reduce((sum, i) => sum + i.sellingPrice * i.qty, 0);
    const gstAmount = value.items.reduce((sum, i) => sum + (i.sellingPrice * i.qty * (i.gstPercent || 0)) / 100, 0);
    const payableAmount = totalAmount + gstAmount;

    const order = await Order.create({
      ...value,
      customer: req.user._id,
      totalAmount,
      gstAmount,
      payableAmount,
      status: ORDER_STATUS.PLACED
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("createOrder:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 UPDATE ORDER (SUPER_ADMIN, Store Roles, Customer)
export const updateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { error, value } = updateOrderSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const canAccess = await checkOrderAccess(req.user, order, req.staffRoleStoreId, req.staffRole);
    if (!canAccess) return res.status(403).json({ message: "Access denied" });

    Object.assign(order, value);
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    console.error("updateOrder:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 GET ORDER BY ID (All Roles)
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const canAccess = await checkOrderAccess(req.user, order, req.staffRoleStoreId, req.staffRole);
    if (!canAccess) return res.status(403).json({ message: "Access denied" });

    res.json({ success: true, order });
  } catch (err) {
    console.error("getOrderById:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// ------------------- Get All Orders -------------------
export const getAllOrders = async (req, res) => {
  try {
    const { error, value } = orderListSchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { page, limit, status, store, customer } = value;
    let filter = {};

    // Role-based access
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      if (req.user.roles.includes(USER_ROLE.CUSTOMER)) {
        filter.customer = req.user._id;
      } else if (req.user.roles.includes(USER_ROLE.VENDOR)) {
        filter.store = req.staffRoleStoreId; // vendor's store
      } else if ([USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some(r => req.user.roles.includes(r))) {
        filter.store = req.staffRoleStoreId;
      }
    }

    // Optional query filters
    if (status) filter.status = status;
    if (store) filter.store = store;
    if (customer) filter.customer = customer;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("customer", "fullName email mobile")
      .populate("store", "storeName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, page, limit, orders });
  } catch (err) {
    console.error("getAllOrders:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 DELETE ORDER (SUPER_ADMIN or Store Roles)
export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const canAccess = await checkOrderAccess(req.user, order, req.staffRoleStoreId, req.staffRole);
    if (!canAccess) return res.status(403).json({ message: "Access denied" });

    await order.deleteOne();
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    console.error("deleteOrder:", err);
    res.status(500).json({ message: "Server error" });
  }
};
