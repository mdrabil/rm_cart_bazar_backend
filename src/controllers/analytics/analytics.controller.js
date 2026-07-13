import { ORDER_STATUS } from "../../constants/enums.js";
import Customer from "../../models/Customer.js";
import OrderModel from "../../models/Order.model.js";
import ProductModel from "../../models/Product.model.js";
import StoreModel from "../../models/Store.model.js";
import StoreStaffModel from "../../models/StoreStaff.model.js";
import UserModel from "../../models/User.model.js";
import { buildStoreFilter } from "../../utils/accessHelper.js";
import { calculateGrowth } from "../../utils/calculateGrowth.js";

export const getOrderAnalytics = async ( req,res) => {
  try {
       const user = req.user;

    const { startDate, endDate,storeId} = req.query;

  
    let currentStart = null;
    let currentEnd = null;

    if (startDate) {
      currentStart = new Date(startDate);
      currentStart.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      currentEnd = new Date(endDate);
      currentEnd.setHours(23, 59, 59, 999);
    }

    // ======================================================
    // CURRENT MATCH
    // ======================================================

    let currentMatch = {};

    // 🔥 STORE ACCESS FILTER
    const accessFilter =
      await buildStoreFilter(user, {
        field: "store",
        storeId,
      });

    currentMatch = {
      ...currentMatch,
      ...accessFilter,
    };

    // DATE FILTER
    if (currentStart && currentEnd) {
      currentMatch.createdAt = {
        $gte: currentStart,
        $lte: currentEnd,
      };
    }

    // ======================================================
    // PREVIOUS SAME RANGE
    // ======================================================

    const previousMatch = {
      ...currentMatch,
    };

    let previousStart = null;
    let previousEnd = null;

    if (currentStart && currentEnd) {
      const rangeDiff =
        currentEnd.getTime() -
        currentStart.getTime();

      previousEnd = new Date(
        currentStart.getTime() - 1
      );

      previousStart = new Date(
        previousEnd.getTime() -
          rangeDiff
      );

      previousMatch.createdAt = {
        $gte: previousStart,
        $lte: previousEnd,
      };
    }

    // ======================================================
    // COMMON STATS
    // ======================================================

    const getStats = async (match) => {
      const data = await OrderModel.aggregate([
        {
          $match: match,
        },

        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum: "$payableAmount",
            },

            totalOrders: {
              $sum: 1,
            },

            totalGST: {
              $sum: "$gstAmount",
            },

            totalDiscount: {
              $sum:
                "$discountAmount",
            },

            totalAmount: {
              $sum: "$totalAmount",
            },
          },
        },
      ]);

      return (
        data[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          totalGST: 0,
          totalDiscount: 0,
          totalAmount: 0,
        }
      );
    };

  


    // ======================================================
    // GET DATA
    // ======================================================

    const currentOverall =
      await getStats(currentMatch);

    const previousOverall =
      await getStats(previousMatch);

    // ======================================================
    // COMPARE FUNCTION
    // ======================================================

    const compareValues = (
      current,
      previous
    ) => {
      const difference =
        current - previous;

      let percentage = 0;

      if (previous > 0) {
        percentage = Number(
          (
            (difference / previous) *
            100
          ).toFixed(2)
        );
      } else if (current > 0) {
        percentage = 100;
      }

      return {
        current,
        previous,

        increased:
          difference > 0,

        decreased:
          difference < 0,

        difference:
          Math.abs(difference),

        percentage:
          Math.abs(percentage),

        trend:
          difference > 0
            ? "INCREASE"
            : difference < 0
            ? "DECREASE"
            : "NO_CHANGE",
      };
    };

    // ======================================================
    // COMPARISON
    // ======================================================

    const comparison = {
      revenue: compareValues(
        currentOverall.totalRevenue,
        previousOverall.totalRevenue
      ),

      orders: compareValues(
        currentOverall.totalOrders,
        previousOverall.totalOrders
      ),

      gst: compareValues(
        currentOverall.totalGST,
        previousOverall.totalGST
      ),

      discount: compareValues(
        currentOverall.totalDiscount,
        previousOverall.totalDiscount
      ),

      amount: compareValues(
        currentOverall.totalAmount,
        previousOverall.totalAmount
      ),
    };

    // ======================================================
    // STATUS WISE
    // ======================================================

    const statusWise =
      await OrderModel.aggregate([
        {
          $match: currentMatch,
        },

        {
          $group: {
            _id: "$status",

            totalOrders: {
              $sum: 1,
            },

            totalAmount: {
              $sum:
                "$payableAmount",
            },
          },
        },

        {
          $project: {
            _id: 0,

            status: "$_id",

            totalOrders: 1,

            totalAmount: 1,
          },
        },
      ]);

    // ======================================================
    // ENSURE ALL STATUS
    // ======================================================

    const allStatuses =
      Object.values(ORDER_STATUS);

    const finalStatusWise =
      allStatuses.map((st) => {
        const found =
          statusWise.find(
            (s) =>
              s.status === st
          );

        return {
          status: st,
          totalOrders:
            found?.totalOrders || 0,
          totalAmount:
            found?.totalAmount || 0,
        };
      });

    // ======================================================
    // PAYMENT METHOD
    // ======================================================

    const paymentMethodStats =
      await OrderModel.aggregate([
        {
          $match: currentMatch,
        },

        {
          $group: {
            _id: "$paymentMethod",

            totalOrders: {
              $sum: 1,
            },

            totalAmount: {
              $sum:
                "$payableAmount",
            },
          },
        },

        {
          $project: {
            _id: 0,

            paymentMethod:
              "$_id",

            totalOrders: 1,

            totalAmount: 1,
          },
        },
      ]);

    // ======================================================
    // GRAPH DATA
    // ======================================================

    // const graphData =
    //   await OrderModel.aggregate([
    //     {
    //       $match: currentMatch,
    //     },

    //     {
    //       $group: {
    //         _id: {
    //           day: {
    //             $dateToString: {
    //               format:
    //                 "%Y-%m-%d",
    //               date:
    //                 "$createdAt",
    //             },
    //           },
    //         },

    //         totalOrders: {
    //           $sum: 1,
    //         },

    //         totalRevenue: {
    //           $sum:
    //             "$payableAmount",
    //         },
    //       },
    //     },

    //     {
    //       $project: {
    //         _id: 0,

    //         date: "$_id.day",

    //         totalOrders: 1,

    //         totalRevenue: 1,
    //       },
    //     },

    //     {
    //       $sort: {
    //         date: 1,
    //       },
    //     },
    //   ]);

    // ======================================================
// GRAPH DATA (DAY / MONTH AUTO)
// ======================================================

// const isSameMonth =
//   currentStart &&
//   currentEnd &&
//   currentStart.getMonth() === currentEnd.getMonth() &&
//   currentStart.getFullYear() === currentEnd.getFullYear();

// const graphData = await OrderModel.aggregate([
//   {
//     $match: currentMatch,
//   },

//   {
//     $group: {
//       _id: isSameMonth
//         ? {
//             day: {
//               $dateToString: {
//                 format: "%Y-%m-%d",
//                 date: "$createdAt",
//               },
//             },
//           }
//         : {
//             month: {
//               $dateToString: {
//                 format: "%Y-%m",
//                 date: "$createdAt",
//               },
//             },
//           },

//       totalOrders: { $sum: 1 },

//       totalRevenue: { $sum: "$payableAmount" },
//     },
//   },

//   {
//     $project: {
//       _id: 0,
//       date: isSameMonth ? "$_id.day" : "$_id.month",
//       totalOrders: 1,
//       totalRevenue: 1,
//     },
//   },

//   {
//     $sort: {
//       date: 1,
//     },
//   },
// ]);

const start = currentStart;
const end = currentEnd;

// safety check
const diffDays =
  (end - start) / (1000 * 60 * 60 * 24);

// 👉 RULE:
// <= 31 days => DAY wise
// > 31 days => MONTH wise
const isDaily = diffDays <= 31;

const graphData = await OrderModel.aggregate([
  {
    $match: currentMatch,
  },

  {
    $group: {
      _id: isDaily
        ? {
            day: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
          }
        : {
            month: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
              },
            },
          },

      totalOrders: { $sum: 1 },
      totalRevenue: { $sum: "$payableAmount" },
    },
  },

  {
    $project: {
      _id: 0,
      date: isDaily ? "$_id.day" : "$_id.month",
      totalOrders: 1,
      totalRevenue: 1,
    },
  },

  {
    $sort: {
      date: 1,
    },
  },
]);

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,

      currentOverall,

      previousOverall,

      comparison,

      statusWise:
        finalStatusWise,

      paymentMethodStats,

      graphData,

      currentRange: {
        startDate:
          currentStart,
        endDate: currentEnd,
      },

      previousRange: {
        startDate:
          previousStart,
        endDate: previousEnd,
      },
    });
  } catch (error) {
    console.log(
      "Order Analytics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};



export const getProductAnalytics = async (req, res) => {
  try {
    const user = req.user;

    const { storeId, startDate, endDate } = req.query;

    // ======================================================
    // STORE ACCESS FILTER
    // ======================================================
    const accessFilter = await buildStoreFilter(user, {
      field: "store",
      storeId,
    });

    let match = { ...accessFilter };

    // ======================================================
    // DATE FILTER
    // ======================================================
    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        match.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    // ======================================================
    // OVERALL PRODUCTS
    // ======================================================
    const totalProducts = await ProductModel.countDocuments(match);

    const previousProducts = await ProductModel.countDocuments({
      store: match.store,
      createdAt: {
        $lt: match.createdAt?.$gte || new Date(),
      },
    });

    const productComparison = {
      current: totalProducts,
      previous: previousProducts,
      increased: totalProducts > previousProducts,
      percentage:
        previousProducts === 0
          ? 100
          : Math.abs(
              ((totalProducts - previousProducts) /
                previousProducts) *
                100,
            ).toFixed(2),
    };

    // ======================================================
    // STORE WISE PRODUCTS
    // ======================================================
    const storeWiseProducts = await ProductModel.aggregate([
      { $match: match },

      {
        $group: {
          _id: "$store",
          totalProducts: { $sum: 1 },
        },
      },

      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "_id",
          as: "store",
        },
      },

      { $unwind: "$store" },

      {
        $project: {
          _id: 0,
          storeId: "$store._id",
          storeName: "$store.name",
          totalProducts: 1,
        },
      },

      { $sort: { totalProducts: -1 } },
    ]);

    // ======================================================
    // TOP 5 TRENDING PRODUCTS (FROM ORDERS)
    // ======================================================
    const trendingProducts = await OrderModel.aggregate([
      { $match: match },

      { $unwind: "$items" },

      {
        $group: {
          _id: "$items.productName",
          totalSold: { $sum: "$items.qty" },
          revenue: {
            $sum: {
              $multiply: [
                "$items.qty",
                "$items.sellingPrice",
              ],
            },
          },
        },
      },

      { $sort: { totalSold: -1 } },

      { $limit: 5 },
    ]);

    // ======================================================
    // RESPONSE
    // ======================================================
    return res.status(200).json({
      success: true,

      currentOverall: {
        totalProducts,
      },

      comparison: {
        totalProducts: productComparison,
      },

      storeWiseProducts,
      trendingProducts,
    });
  } catch (error) {
    console.log("Product Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// export const getProductAnalytics = async (req, res) => {
//   try {
//     const user = req.user;

//     const { storeId, startDate, endDate } = req.query;

//     // ======================================================
//     // STORE ACCESS FILTER
//     // ======================================================
//     const accessFilter = await buildStoreFilter(user, {
//       field: "store",
//       storeId,
//     });

//     let match = { ...accessFilter };

//     // ======================================================
//     // DATE FILTER
//     // ======================================================
//     if (startDate || endDate) {
//       match.createdAt = {};

//       if (startDate) {
//         const start = new Date(startDate);
//         start.setHours(0, 0, 0, 0);
//         match.createdAt.$gte = start;
//       }

//       if (endDate) {
//         const end = new Date(endDate);
//         end.setHours(23, 59, 59, 999);
//         match.createdAt.$lte = end;
//       }
//     }

//     // ======================================================
//     // OVERALL STATS
//     // ======================================================

//     const totalProducts = await ProductModel.countDocuments(match);

//     const activeProducts = await ProductModel.countDocuments({
//       ...match,
//       status: "ACTIVE",
//     });

//     const inactiveProducts = await ProductModel.countDocuments({
//       ...match,
//       status: { $ne: "ACTIVE" },
//     });

//     // ======================================================
//     // STORE WISE PRODUCT COUNT
//     // ======================================================

//     const storeWiseProducts = await ProductModel.aggregate([
//       { $match: match },

//       {
//         $group: {
//           _id: "$store",
//           totalProducts: { $sum: 1 },
//           activeProducts: {
//             $sum: {
//               $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0],
//             },
//           },
//         },
//       },

//       {
//         $lookup: {
//           from: "stores",
//           localField: "_id",
//           foreignField: "_id",
//           as: "store",
//         },
//       },

//       { $unwind: "$store" },

//       {
//         $project: {
//           _id: 0,
//           storeId: "$store._id",
//           storeName: "$store.name",
//           totalProducts: 1,
//           activeProducts: 1,
//         },
//       },
//     ]);

//     // ======================================================
//     // CATEGORY WISE
//     // ======================================================

//     const categoryStats = await ProductModel.aggregate([
//       { $match: match },

//       {
//         $group: {
//           _id: "$category",
//           total: { $sum: 1 },
//         },
//       },

//       {
//         $lookup: {
//           from: "categories",
//           localField: "_id",
//           foreignField: "_id",
//           as: "category",
//         },
//       },

//       { $unwind: "$category" },

//       {
//         $project: {
//           _id: 0,
//           category: "$category.name",
//           total: 1,
//         },
//       },
//     ]);

//     // ======================================================
//     // VARIANT STOCK ANALYTICS
//     // ======================================================

//     const variantStats = await ProductModel.aggregate([
//       { $match: match },

//       { $unwind: "$variants" },

//       {
//         $group: {
//           _id: null,
//           totalVariants: { $sum: 1 },
//           totalStock: { $sum: "$variants.stockQty" },
//         },
//       },
//     ]);

//     // ======================================================
//     // LOW STOCK PRODUCTS
//     // ======================================================

//     const lowStockProducts = await ProductModel.find({
//       ...match,
//       "variants.stockQty": { $lte: 5 },
//     })
//       .select("name variants store")
//       .limit(5);

//     // ======================================================
//     // RESPONSE
//     // ======================================================

//     return res.status(200).json({
//       success: true,

//       currentOverall: {
//         totalProducts,
//         activeProducts,
//         inactiveProducts,
//         totalVariants: variantStats[0]?.totalVariants || 0,
//         totalStock: variantStats[0]?.totalStock || 0,
//       },

//       storeWiseProducts,
//       categoryStats,
//       lowStockProducts,
//     });
//   } catch (error) {
//     console.log("Product Analytics Error:", error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// controllers/customerAnalytics.controller.js


export const getCustomerAnalytics = async (req, res) => {
  try {
    const user = req.user;

    const { startDate, endDate, storeId } = req.query;

   
    let match = {};

    const accessFilter = await buildStoreFilter(user, {
      field: "store",
      storeId,
    });

    match = { ...match, ...accessFilter };

    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        match.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    // ======================================================
    // PREVIOUS PERIOD (COMPARISON)
    // ======================================================

    let prevMatch = { ...match };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const diff = end.getTime() - start.getTime();

      const prevStart = new Date(start.getTime() - diff);
      const prevEnd = new Date(start.getTime() - 1);

      prevMatch.createdAt = {
        $gte: prevStart,
        $lte: prevEnd,
      };
    }

    // ======================================================
    // HELPER FUNCTION
    // ======================================================

    // const getStats = async (filter) => {
    //   const totalCustomers = await OrderModel.distinct("customerId", filter);

    //   const repeat = await OrderModel.aggregate([
    //     { $match: filter },
    //     {
    //       $group: {
    //         _id: "$customerId",
    //         totalOrders: { $sum: 1 },
    //       },
    //     },
    //     { $match: { totalOrders: { $gt: 1 } } },
    //     { $count: "count" },
    //   ]);

    //   const newCust = await OrderModel.aggregate([
    //     { $match: filter },
    //     { $sort: { createdAt: 1 } },
    //     {
    //       $group: {
    //         _id: "$customerId",
    //         firstOrder: { $first: "$createdAt" },
    //       },
    //     },
    //     {
    //       $count: "count",
    //     },
    //   ]);

    //   return {
    //     active: totalCustomers.length,
    //     repeat: repeat[0]?.count || 0,
    //     new: newCust[0]?.count || 0,
    //   };
    // };
    const getStats = async (filter) => {
  const totalCustomers = await Customer.distinct("_id", filter);

  const activeCustomers = await Customer.countDocuments({
    ...filter,
    isBlocked: false,
  });

  const inactiveCustomers = await Customer.countDocuments({
    ...filter,
    isBlocked: true,
  });

  const repeat = await OrderModel.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$customerId",
        totalOrders: { $sum: 1 },
      },
    },
    { $match: { totalOrders: { $gt: 1 } } },
    { $count: "count" },
  ]);

  const newCust = await OrderModel.aggregate([
    { $match: filter },
    { $sort: { createdAt: 1 } },
    {
      $group: {
        _id: "$customerId",
        firstOrder: { $first: "$createdAt" },
      },
    },
    { $count: "count" },
  ]);

  return {
    total: totalCustomers.length,
    active: activeCustomers,
    inactive: inactiveCustomers,
    repeat: repeat[0]?.count || 0,
    new: newCust[0]?.count || 0,
  };
};

    // ======================================================
    // CURRENT + PREVIOUS
    // ======================================================

    const current = await getStats(match);
    const previous = await getStats(prevMatch);
    

    // ======================================================
    // TOP CUSTOMERS
    // ======================================================

    const topCustomers = await OrderModel.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$customerId",
          totalOrders: { $sum: 1 },
          totalSpend: { $sum: "$payableAmount" },
          currentStatus: { $first: "$status" },
          lastOrderDate: { $first: "$createdAt" },
          firstOrderDate: { $last: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $project: {
          _id: 0,
          customerId: "$customer._id",
          fullName: "$customer.fullName",
          email: "$customer.email",
          mobile: "$customer.mobile",
          dp: "$customer.dp",
          status: "$customer.isBlocked",
          totalOrders: 1,
          totalSpend: 1,
          currentStatus: 1,
          firstOrderDate: 1,
          lastOrderDate: 1,
        },
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 5 },
    ]);

    // ======================================================
    // STATUS WISE
    // ======================================================

    const customerStatusStats = await OrderModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          totalOrders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          totalOrders: 1,
        },
      },
    ]);

    // ======================================================
    // RESPONSE
    // ======================================================

return res.status(200).json({
  success: true,

  currentOverall: {
    totalCustomers: current.total,
    activeCustomers: current.active,
    inactiveCustomers: current.inactive,
    repeatCustomers: current.repeat,
    newCustomers: current.new,
  },

  comparison: {
    totalCustomers: {
      current: current.total,
      previous: previous.total,
      ...calculateGrowth(current.total, previous.total),
    },

    activeCustomers: {
      current: current.active,
      previous: previous.active,
      ...calculateGrowth(current.active, previous.active),
    },

    inactiveCustomers: {
      current: current.inactive,
      previous: previous.inactive,
      ...calculateGrowth(current.inactive, previous.inactive),
    },

    repeatCustomers: {
      current: current.repeat,
      previous: previous.repeat,
      ...calculateGrowth(current.repeat, previous.repeat),
    },

    newCustomers: {
      current: current.new,
      previous: previous.new,
      ...calculateGrowth(current.new, previous.new),
    },
  },

  topCustomers,
  customerStatusStats,
});
  } catch (error) {
    console.log("Customer Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // ======================================================
    // DATE FILTER
    // ======================================================
    let match = {};

    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        match.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.createdAt.$lte = end;
      }
    }

    // ======================================================
    // OVERALL (WITH FILTER)
    // ======================================================

    const totalUsers = await UserModel.countDocuments(match);

    const totalActiveUsers = await UserModel.countDocuments({
      ...match,
      lastLoginAt: { $ne: null },
      isBlocked: false,
    });

    const totalInactiveUsers = await UserModel.countDocuments({
      ...match,
      $or: [
        { lastLoginAt: null },
        { isBlocked: true },
      ],
    });

    const totalBlockedUsers = await UserModel.countDocuments({
      ...match,
      isBlocked: true,
    });

    // ======================================================
    // RECENT USERS (WITH FILTER)
    // ======================================================

    const recentUsers = await UserModel.find(match)
      .select("fullName mobile email dp socials lastLoginAt createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,
      currentOverall: {
        totalUsers,
        totalActiveUsers,
        totalInactiveUsers,
        totalBlockedUsers,
      },
      recentUsers,
    });

  } catch (error) {
    console.log("User Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getStoreStaffAnalytics = async (
  req,
  res
) => {
  try {
    const {
      startDate,
      endDate,
      storeId,
      role,
      search,
    } = req.query;

    // ======================================================
    // CURRENT RANGE
    // ======================================================

    let currentStart = null;
    let currentEnd = null;

    if (startDate) {
      currentStart = new Date(startDate);

      currentStart.setHours(
        0,
        0,
        0,
        0
      );
    }

    if (endDate) {
      currentEnd = new Date(endDate);

      currentEnd.setHours(
        23,
        59,
        59,
        999
      );
    }

    // ======================================================
    // CURRENT MATCH
    // ======================================================

    let currentMatch = {};

    // 🔥 STORE ACCESS FILTER
    const accessFilter =
      await buildStoreFilter(req.user, {
        field: "store",
        storeId,
      });

    currentMatch = {
      ...currentMatch,
      ...accessFilter,
    };

    // ROLE FILTER
    if (role) {
      currentMatch.role = role;
    }

    // SEARCH FILTER
    if (search) {
      const users = await UserModel.find(
        {
          $text: {
            $search: search,
          },
        },
        { _id: 1 }
      ).lean();

      currentMatch.user = {
        $in: users.map(
          (u) => u._id
        ),
      };
    }

    // DATE FILTER
    if (currentStart && currentEnd) {
      currentMatch.createdAt = {
        $gte: currentStart,
        $lte: currentEnd,
      };
    }

    // ======================================================
    // PREVIOUS MATCH
    // ======================================================

    const previousMatch = {
      ...currentMatch,
    };

    let previousStart = null;
    let previousEnd = null;

    if (currentStart && currentEnd) {
      const rangeDiff =
        currentEnd.getTime() -
        currentStart.getTime();

      previousEnd = new Date(
        currentStart.getTime() - 1
      );

      previousStart = new Date(
        previousEnd.getTime() -
          rangeDiff
      );

      previousMatch.createdAt = {
        $gte: previousStart,
        $lte: previousEnd,
      };
    }

    // ======================================================
    // COMMON STATS
    // ======================================================

    const getStats = async (match) => {
      const totalStaff =
        await StoreStaffModel.countDocuments(
          match
        );

      const totalActiveStaff =
        await StoreStaffModel.countDocuments({
          ...match,
          isActive: true,
        });

      const totalInactiveStaff =
        await StoreStaffModel.countDocuments({
          ...match,
          isActive: false,
        });

      return {
        totalStaff,
        totalActiveStaff,
        totalInactiveStaff,
      };
    };

    // ======================================================
    // CURRENT + PREVIOUS
    // ======================================================

    const currentOverall =
      await getStats(currentMatch);

    const previousOverall =
      await getStats(previousMatch);

    // ======================================================
    // COMPARE FUNCTION
    // ======================================================

    const compareValues = (
      current,
      previous
    ) => {
      const difference =
        current - previous;

      let percentage = 0;

      if (previous > 0) {
        percentage = Number(
          (
            (difference / previous) *
            100
          ).toFixed(2)
        );
      } else if (current > 0) {
        percentage = 100;
      }

      return {
        current,
        previous,

        increased:
          difference > 0,

        decreased:
          difference < 0,

        difference:
          Math.abs(difference),

        percentage:
          Math.abs(percentage),

        trend:
          difference > 0
            ? "INCREASE"
            : difference < 0
            ? "DECREASE"
            : "NO_CHANGE",
      };
    };

    // ======================================================
    // COMPARISON
    // ======================================================

    const comparison = {
      totalStaff:
        compareValues(
          currentOverall.totalStaff,
          previousOverall.totalStaff
        ),

      activeStaff:
        compareValues(
          currentOverall.totalActiveStaff,
          previousOverall.totalActiveStaff
        ),

      inactiveStaff:
        compareValues(
          currentOverall.totalInactiveStaff,
          previousOverall.totalInactiveStaff
        ),
    };

    // ======================================================
    // ROLE WISE STATS
    // ======================================================

    const roleWiseStats =
      await StoreStaffModel.aggregate([
        {
          $match: currentMatch,
        },

        {
          $group: {
            _id: "$role",

            totalStaff: {
              $sum: 1,
            },

            activeStaff: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isActive",
                      true,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            inactiveStaff: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isActive",
                      false,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },

        {
          $project: {
            _id: 0,

            role: "$_id",

            totalStaff: 1,

            activeStaff: 1,

            inactiveStaff: 1,
          },
        },

        {
          $sort: {
            totalStaff: -1,
          },
        },
      ]);

    // ======================================================
    // STORE WISE STATS
    // ======================================================

    const storeWiseStats =
      await StoreStaffModel.aggregate([
        {
          $match: currentMatch,
        },

        {
          $group: {
            _id: "$store",

            totalStaff: {
              $sum: 1,
            },

            activeStaff: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isActive",
                      true,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            inactiveStaff: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$isActive",
                      false,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },

        {
          $lookup: {
            from: "stores",

            localField: "_id",

            foreignField: "_id",

            as: "store",
          },
        },

        {
          $unwind: "$store",
        },

        {
          $project: {
            _id: 0,

            storeId:
              "$store._id",

            storeName:
              "$store.storeName",

            totalStaff: 1,

            activeStaff: 1,

            inactiveStaff: 1,
          },
        },

        {
          $sort: {
            totalStaff: -1,
          },
        },
      ]);

    // ======================================================
    // TOP 5 STAFF
    // ======================================================

    const topStaff =
      await StoreStaffModel.find(
        currentMatch
      )
        .populate(
          "user",
          "fullName mobile dp"
        )
        .populate(
          "store",
          "storeName"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .lean();

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,

      currentOverall,

      previousOverall,

      comparison,

      roleWiseStats,

      storeWiseStats,

      topStaff,

      currentRange: {
        startDate:
          currentStart,

        endDate: currentEnd,
      },

      previousRange: {
        startDate:
          previousStart,

        endDate: previousEnd,
      },
    });
  } catch (error) {
    console.log(
      "Store Staff Analytics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};




// controllers/storeAnalytics.controller.js
export const getStoreAnalytics = async (
  req,
  res
) => {
  try {
    const user = req.user;

    const {
      startDate,
      endDate,
      storeId,
    } = req.query;

    // ======================================================
    // CURRENT RANGE
    // ======================================================

    let currentStart = null;
    let currentEnd = null;

    if (startDate) {
      currentStart = new Date(startDate);

      currentStart.setHours(
        0,
        0,
        0,
        0
      );
    }

    if (endDate) {
      currentEnd = new Date(endDate);

      currentEnd.setHours(
        23,
        59,
        59,
        999
      );
    }

    // ======================================================
    // CURRENT MATCH
    // ======================================================

    let currentMatch = {};

    // 🔥 STORE ACCESS FILTER
    const accessFilter =
      await buildStoreFilter(user, {
        field: "_id",
        storeId,
      });

    currentMatch = {
      ...currentMatch,
      ...accessFilter,
    };

    // DATE FILTER
    if (currentStart && currentEnd) {
      currentMatch.createdAt = {
        $gte: currentStart,
        $lte: currentEnd,
      };
    }

    // ======================================================
    // PREVIOUS RANGE
    // ======================================================

    const previousMatch = {
      ...currentMatch,
    };

    let previousStart = null;
    let previousEnd = null;

    if (currentStart && currentEnd) {
      const rangeDiff =
        currentEnd.getTime() -
        currentStart.getTime();

      previousEnd = new Date(
        currentStart.getTime() - 1
      );

      previousStart = new Date(
        previousEnd.getTime() -
          rangeDiff
      );

      previousMatch.createdAt = {
        $gte: previousStart,
        $lte: previousEnd,
      };
    }

    // ======================================================
    // COMMON STATS
    // ======================================================

    const getStats = async (match) => {
      const totalStores =
        await StoreModel.countDocuments(
          match
        );

      const totalActiveStores =
        await StoreModel.countDocuments({
          ...match,
          isActive: true,
        });

      const totalInactiveStores =
        await StoreModel.countDocuments({
          ...match,
          isActive: false,
        });

      const totalVerifiedStores =
        await StoreModel.countDocuments({
          ...match,
          isVerified: true,
        });

      const totalUnverifiedStores =
        await StoreModel.countDocuments({
          ...match,
          isVerified: false,
        });

      return {
        totalStores,
        totalActiveStores,
        totalInactiveStores,
        totalVerifiedStores,
        totalUnverifiedStores,
      };
    };

    // ======================================================
    // CURRENT + PREVIOUS
    // ======================================================

    const currentOverall =
      await getStats(currentMatch);

    const previousOverall =
      await getStats(previousMatch);

    // ======================================================
    // COMPARE FUNCTION
    // ======================================================

    const compareValues = (
      current,
      previous
    ) => {
      const difference =
        current - previous;

      let percentage = 0;

      if (previous > 0) {
        percentage = Number(
          (
            (difference / previous) *
            100
          ).toFixed(2)
        );
      } else if (current > 0) {
        percentage = 100;
      }

      return {
        current,
        previous,

        increased:
          difference > 0,

        decreased:
          difference < 0,

        difference:
          Math.abs(difference),

        percentage:
          Math.abs(percentage),

        trend:
          difference > 0
            ? "INCREASE"
            : difference < 0
            ? "DECREASE"
            : "NO_CHANGE",
      };
    };

    // ======================================================
    // COMPARISON
    // ======================================================

    const comparison = {
      totalStores:
        compareValues(
          currentOverall.totalStores,
          previousOverall.totalStores
        ),

      activeStores:
        compareValues(
          currentOverall.totalActiveStores,
          previousOverall.totalActiveStores
        ),

      inactiveStores:
        compareValues(
          currentOverall.totalInactiveStores,
          previousOverall.totalInactiveStores
        ),

      verifiedStores:
        compareValues(
          currentOverall.totalVerifiedStores,
          previousOverall.totalVerifiedStores
        ),
    };

    // ======================================================
    // TOP 5 RECENT STORES
    // ======================================================

    const recentStores =
      await StoreModel.find(currentMatch)
        .populate(
          "owner",
          "fullName mobile"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .select(
          "storeName status isActive isVerified address createdAt"
        );

    // ======================================================
    // CITY WISE STORES
    // ======================================================

    const cityWiseStores =
      await StoreModel.aggregate([
        {
          $match: currentMatch,
        },

        {
          $group: {
            _id:
              "$address.city",

            totalStores: {
              $sum: 1,
            },
          },
        },

        {
          $project: {
            _id: 0,

            city: "$_id",

            totalStores: 1,
          },
        },

        {
          $sort: {
            totalStores: -1,
          },
        },
      ]);

    // ======================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,

      currentOverall,

      previousOverall,

      comparison,

      recentStores,

      cityWiseStores,

      currentRange: {
        startDate:
          currentStart,
        endDate: currentEnd,
      },

      previousRange: {
        startDate:
          previousStart,
        endDate: previousEnd,
      },
    });
  } catch (error) {
    console.log(
      "Store Analytics Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};