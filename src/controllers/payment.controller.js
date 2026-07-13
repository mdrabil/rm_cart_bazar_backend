import mongoose from "mongoose";

import { config } from "../config/config.js";

import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";
import Payment from "../models/Payment.model.js";
import Customer from "../models/Customer.js";
import Coupon from "../models/Coupon.model.js";
import CouponUsage from "../models/CouponUsage.model.js";
import StoreModel from "../models/Store.model.js";

import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/enums.js";

import { generateMRId } from "../utils/mrId.js";
import { buildStoreFilter } from "../utils/accessHelper.js";




// ===============================
// GET PAYMENTS
// ===============================
export const getPayments = async (req, res) => {
  try {
    const user = req.user;

    const roleNames = req.user.roles || [];

const isAdmin = roleNames.includes("ADMIN");
const isSuperAdmin = roleNames.includes("SUPER_ADMIN");

const canViewGateway = isAdmin || isSuperAdmin;

    const {
      page = 1,
      limit = 10,
      search,
      status,
      method,
      store,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    // ================= STORE ACCESS =================
    const accessFilter = await buildStoreFilter(user, {
      field: "store",
      storeId: store,
    });

    // ================= GET ALLOWED ORDER IDS =================
    const allowedOrders = await Order.find(accessFilter)
      .select("_id");

    const allowedOrderIds = allowedOrders.map(
      (o) => o._id
    );

    // ================= PAYMENT ACCESS =================
    query.order = {
      $in: allowedOrderIds,
    };

    // ================= SEARCH =================
    if (search && search.trim() !== "") {
      query.$or = [
        {
          transactionId: {
            $regex: search,
            $options: "i",
          },
        },

        {
          mrPaymentId: {
            $regex: search,
            $options: "i",
          },
        },

        {
          "customer.name": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "customer.email": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "customer.phone": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ================= STATUS FILTER =================
    if (
      status &&
      Object.values(PAYMENT_STATUS).includes(status)
    ) {
      query.status = status;
    }

    // ================= METHOD FILTER =================
    if (method) {
      query.method = method;
    }

    // ================= SORT =================
    let sort = {};

    sort[sortBy] =
      sortOrder === "asc" ? 1 : -1;

    // ================= TOTAL =================
    const total = await Payment.countDocuments(
      query
    );

    // ================= PAYMENT SUMMARY =================
    const paymentSummaryAgg =
      await Payment.aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: "$status",

            totalPayments: {
              $sum: 1,
            },

            totalAmount: {
              $sum: "$amount",
            },
          },
        },
      ]);

    const summary = {
      totalPayments: total,

      totalSuccessPayments: 0,

      totalFailedPayments: 0,

      totalInitiatedPayments: 0,

      totalRefundedPayments: 0,

      totalSuccessAmount: 0,

      totalFailedAmount: 0,
    };

    paymentSummaryAgg.forEach((item) => {
      switch (item._id) {
        case PAYMENT_STATUS.SUCCESS:
          summary.totalSuccessPayments =
            item.totalPayments;

          summary.totalSuccessAmount =
            item.totalAmount;

          break;

        case PAYMENT_STATUS.FAILED:
          summary.totalFailedPayments =
            item.totalPayments;

          summary.totalFailedAmount =
            item.totalAmount;

          break;

        case PAYMENT_STATUS.INITIATED:
          summary.totalInitiatedPayments =
            item.totalPayments;

          break;

        case PAYMENT_STATUS.REFUNDED:
          summary.totalRefundedPayments =
            item.totalPayments;

          break;
      }
    });

    // ================= PAYMENTS =================
    // const payments = await Payment.find(query).populate({
    //     path: "order",

    //     select:
    //       "mrOrderId store totalAmount payableAmount status",

    //     populate: {
    //       path: "store",

    //       select:
    //         "_id storeName address",
    //     },
    //   })

    let selectFields = `
  mrPaymentId
  order
  amount
  method
  paymentMethodType
  status
  transactionId
  customer
  createdAt
  updatedAt
`;

if (canViewGateway) {
  selectFields += `
    gatewayOrderId
    gatewayResponse
  `;
}

const payments = await Payment.find(query)
  .select(selectFields)
  .populate({
    path: "order",
    select: "mrOrderId store totalAmount payableAmount status",
    populate: {
      path: "store",
      select: "_id storeName address",
    },
  })
  .sort(sort)
  .skip((page - 1) * limit)
  .limit(Number(limit));
    res.status(200).json({
      success: true,

      data: payments,

      summary,

      pagination: {
        total,

        page: Number(page),

        limit: Number(limit),

        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "getPayments:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNonSuccessPayments = async (req, res) => {
  try {
    const user = req.user;

    const roleNames = req.user.roles || [];

    const isAdmin = roleNames.includes("ADMIN");
    const isSuperAdmin = roleNames.includes("SUPER_ADMIN");

    const canViewGateway = isAdmin || isSuperAdmin;

    const {
      page = 1,
      limit = 10,
      search,
      method,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // ================= QUERY =================
    let query = {
      status: { $ne: PAYMENT_STATUS.SUCCESS },
    };

    // ================= SEARCH =================
    if (search && search.trim() !== "") {
      query.$or = [
        { transactionId: { $regex: search, $options: "i" } },
        { mrPaymentId: { $regex: search, $options: "i" } },
        { gatewayOrderId: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.email": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
      ];
    }

    // ================= METHOD FILTER =================
    if (method) {
      query.method = method;
    }

    // ================= SORT =================
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // ================= TOTAL =================
    const total = await Payment.countDocuments(query);

    // ================= AGGREGATE SUMMARY =================
    const summaryAgg = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // ================= FINAL SUMMARY =================
    const summary = {
      totalPayments: total,
      totalAmount: 0,

      totalFailedPayments: 0,
      totalFailedAmount: 0,

      totalInitiatedPayments: 0,
      totalInitiatedAmount: 0,

      totalRefundedPayments: 0,
      totalRefundedAmount: 0,
    };

    summaryAgg.forEach((item) => {
      summary.totalAmount += item.totalAmount;

      switch (item._id) {
        case PAYMENT_STATUS.FAILED:
          summary.totalFailedPayments = item.totalPayments;
          summary.totalFailedAmount = item.totalAmount;
          break;

        case PAYMENT_STATUS.INITIATED:
          summary.totalInitiatedPayments = item.totalPayments;
          summary.totalInitiatedAmount = item.totalAmount;
          break;

        case PAYMENT_STATUS.REFUNDED:
          summary.totalRefundedPayments = item.totalPayments;
          summary.totalRefundedAmount = item.totalAmount;
          break;
      }
    });

    // ================= SELECT FIELDS =================
    let selectFields = `
      mrPaymentId
      order
      amount
      method
      paymentMethodType
      status
      transactionId
      gatewayOrderId
      customer
      failureReason
      createdAt
      updatedAt
    `;

    if (canViewGateway) {
      selectFields += `
        gatewayResponse
      `;
    }

    // ================= PAYMENTS =================
    const payments = await Payment.find(query)
      .select(selectFields)
      .populate({
        path: "order",
        select: "mrOrderId store totalAmount payableAmount status",
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // ================= RESPONSE =================
    return res.status(200).json({
      success: true,
      data: payments,
      summary,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getNonSuccessPayments:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// âœ… Get single Payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(id)
      .populate({
        path: "order",
        select: "mrOrderId store totalAmount payableAmount",
        populate: {
          path: "store",
          select: "_id storeName",
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // ================= ACCESS CHECK =================
    const accessFilter = await buildStoreFilter(user, {
      field: "_id",
      storeId: payment.order?.store?._id,
    });

    const allowedOrder = await Order.findOne({
      _id: payment.order?._id,
      ...accessFilter,
    });

    if (!allowedOrder) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const user = req.user;

    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    if (
      !status ||
      !Object.values(PAYMENT_STATUS).includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const payment = await Payment.findById(id)
      .populate("order", "store");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // ================= ACCESS CHECK =================
    const accessFilter = await buildStoreFilter(user, {
      field: "_id",
      storeId: payment.order?.store,
    });

    const allowedOrder = await Order.findOne({
      _id: payment.order?._id,
      ...accessFilter,
    });

    if (!allowedOrder) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    payment.status = status;

    await payment.save();

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// âœ… Delete Payment
export const deletePayment = async (req, res) => {
  try {

        const roleNames = req.user.roles || [];
    
    const isAdmin = roleNames.includes("ADMIN");
    const isSuperAdmin = roleNames.includes("SUPER_ADMIN");
    
    if (!isAdmin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete payment"
      });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid payment ID" });

    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    res.status(200).json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
