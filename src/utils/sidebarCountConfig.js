import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Store from "../models/Store.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Blog from "../models/Blog.js";
import Coupon from "../models/Coupon.js";
import Testimonial from "../models/Testimonial.js";
import Enquiry from "../models/Enquiry.js";
import Job from "../models/Job.js";
import Payment from "../models/Payment.js";

export const SIDEBAR_COUNT_CONFIG = {
  totalOrders: {
    model: Order,
    filter: {},
  },

  pendingOrders: {
    model: Order,
    filter: {
      status: "PLACED",
    },
  },

  deliveredOrders: {
    model: Order,
    filter: {
      status: "DELIVERED",
    },
  },

  totalProducts: {
    model: Product,
    filter: {},
  },

  totalStores: {
    model: Store,
    filter: {},
  },

  totalCategories: {
    model: Category,
    filter: {},
  },

  totalUsers: {
    model: User,
    filter: {},
  },

  totalBlogs: {
    model: Blog,
    filter: {},
  },

  totalCoupons: {
    model: Coupon,
    filter: {},
  },

  totalTestimonials: {
    model: Testimonial,
    filter: {},
  },

  totalEnquiries: {
    model: Enquiry,
    filter: {},
  },

  totalJobs: {
    model: Job,
    filter: {},
  },

  successfulPayments: {
    model: Payment,
    filter: {
      paymentStatus: "SUCCESS",
    },
  },

  failedPayments: {
    model: Payment,
    filter: {
      paymentStatus: {
        $ne: "SUCCESS",
      },
    },
  },
};