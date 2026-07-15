

export const USER_ROLE = Object.freeze({
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  USER: "USER",

  GLOBAL_SUPPORT: "GLOBAL_SUPPORT", // system support
  VENDOR: "VENDOR",                 // seller / store owner
  SALES_ADMIN: "SALES_ADMIN",       // sales team (global)
});

export const STAFF_USER_ROLE = Object.freeze({
  STORE_MANAGER: "STORE_MANAGER",
  OWNER:"OWNER",
  STAFF: "STAFF",
  CHEF: "CHEF",
  RIDER: "RIDER",
  DELIVERY_MANAGER: "DELIVERY_MANAGER",
    STORE_AUTHOR: "STORE_AUTHOR",

  STORE_SUPPORT: "STORE_SUPPORT",
  SALES_EXECUTIVE: "SALES_EXECUTIVE", 
});

export const STATUS  = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});


export const PRODUCT_AREAS = [
  "front",
  "back",
  "leftSleeve",
  "rightSleeve",
  "pocket",
  "none"
];

export const STORE_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED"
});


export const VARIFICATION_TYPE = Object.freeze({
  PENDING: "PENDING",
  ON_HOLD:"ON_HOLD",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED"
});

export const STORE_OWNERSHIP_MODEL = Object.freeze({
  COCO: "COCO",   // Company Owned Company Operated
  FOCO: "FOCO",   // Franchise Owned Company Operated
  FOFO: "FOFO"    // Franchise Owned Franchise Operated (optional future)
});

export const ORDER_STATUS = Object.freeze({
  PLACED: "PLACED",
  PREPARING: "PREPARING",
  READY: "READY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
    ON_HOLD: "ON_HOLD",
});

/** Where the order was placed — website or mobile app */
export const ORDER_SOURCE = Object.freeze({
  WEBSITE: "website",
  APP: "app",
});


export const COUPON_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
    EXPIRED: "EXPIRED",
  DISABLED: "DISABLED",

};

export const COUPON_TYPE = {
  FLAT: "FLAT",
  PERCENT: "PERCENT"
};

export const PAYMENT_STATUS = Object.freeze({
  INITIATED: "INITIATED",
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
  AUTHORIZED: "AUTHORIZED",
  CAPTURED: "CAPTURED",
  EXPIRED: "EXPIRED",
});


export const CATEGORY_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE"
});

export const PRODUCT_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  DISABLED: "DISABLED"
});

export const MODULE_KEY = Object.freeze({
  DASHBOARD: 'DASHBOARD',
  PRODUCTS: 'PRODUCTS',
  ENQUIRIES: 'ENQUIRIES',
  ORDERS: 'ORDERS',
  STORES: 'STORES',
  BLOGS: 'BLOGS',
  WEBSITES: 'WEBSITES',
  ROLES: 'ROLES',
  CART: 'CART',
  JOBS: 'JOBS',
  PAYMENTS: 'PAYMENTS',
  PAYMENT_GATEWAYS: 'PAYMENT_GATEWAYS',
  MAINTENANCE:'MAINTENANCE',
  CATEGORIES: 'CATEGORIES',
  TESTIMONIALS: 'TESTIMONIALS',
  CUSTOMERS: 'CUSTOMERS',
  COUPONS: 'COUPONS',
  USERS_STAFF: 'USERS_STAFF',
  GLOBAL_USERS: 'GLOBAL_USERS',
  SETTINGS: 'SETTINGS',
  PAGE404: 'PAGE404',
  BANNERS:"BANNERS"
});



// ✅ Payment methods
export const PAYMENT_METHODS = Object.freeze({
  RAZORPAY: "RAZORPAY",
  PHONEPE: "PHONEPE",
  PAYTM: "PAYTM",
  UPI: "UPI",
  CARD: "CARD",
  WALLET: "WALLET",
});
//   /* ---------------- DASHBOARD ---------------- */
//   DASHBOARD: "DASHBOARD",

//   /* ---------------- USER & ACCESS ---------------- */
//   USER: "USER",
//   ROLE: "ROLE",
//   PERMISSION: "PERMISSION",
//   STAFF: "STAFF",

//     CUSTOMER: "CUSTOMER",
//   CART: "CART",
//   WISHLIST: "WISHLIST",
 

//   /* ---------------- STORE ---------------- */
//   STORE: "STORE",
//   STORE_TIMING: "STORE_TIMING",
//   STORE_STAFF: "STORE_STAFF",
//   AUTHOR: "AUTHOR",
//   STORE_DOCUMENT: "STORE_DOCUMENT",
//   STORE_PAYOUT: "STORE_PAYOUT",

//   /* ---------------- CATALOG ---------------- */
//   CATEGORY: "CATEGORY",
//   SUB_CATEGORY: "SUB_CATEGORY",
//   BRAND: "BRAND",
//   PRODUCT: "PRODUCT",
//   PRODUCT_VARIANT: "PRODUCT_VARIANT",
//   PRODUCT_STOCK: "PRODUCT_STOCK",
//   PRODUCT_REVIEW: "PRODUCT_REVIEW",

//   /* ---------------- ORDER ---------------- */
//   ORDER: "ORDER",
//   ORDER_ITEM: "ORDER_ITEM",
//   ORDER_TRACKING: "ORDER_TRACKING",
//   CART: "CART",

//   /* ---------------- DELIVERY ---------------- */
//   DELIVERY: "DELIVERY",
//   RIDER: "RIDER",
//   RIDER_PAYOUT: "RIDER_PAYOUT",
//   DELIVERY_ZONE: "DELIVERY_ZONE",

//   /* ---------------- PAYMENT ---------------- */
//   PAYMENT: "PAYMENT",
//   PAYMENT_METHOD: "PAYMENT_METHOD",
//   REFUND: "REFUND",
//   WALLET: "WALLET",
//   COMMISSION: "COMMISSION",

//   /* ---------------- PROMOTION ---------------- */
//   COUPON: "COUPON",
//   OFFER: "OFFER",
//   BANNER: "BANNER",

//   /* ---------------- REPORT & ANALYTICS ---------------- */
//   REPORT: "REPORT",
//   ANALYTICS: "ANALYTICS",

//   /* ---------------- SUPPORT ---------------- */
//   SUPPORT_TICKET: "SUPPORT_TICKET",
//   CHAT: "CHAT",

//   /* ---------------- SYSTEM ---------------- */
//   NOTIFICATION: "NOTIFICATION",
//   SETTING: "SETTING",
//   AUDIT_LOG: "AUDIT_LOG"
// });


// export const MODULE_KEY = Object.freeze({
//   DASHBOARD: "DASHBOARD",

//   USER: "USER",
//   ROLE: "ROLE",
//   STAFF: "STAFF",

//   STORE: "STORE",
//   STORE_TIMING: "STORE_TIMING",
//   STORE_STAFF: "STORE_STAFF",

//   CATEGORY: "CATEGORY",
//   SUB_CATEGORY: "SUB_CATEGORY",
//   PRODUCT: "PRODUCT",
//   PRODUCT_VARIANT: "PRODUCT_VARIANT",

//   ORDER: "ORDER",
//   ORDER_ITEM: "ORDER_ITEM",

//   PAYMENT: "PAYMENT",
//   REFUND: "REFUND",

//   COUPON: "COUPON",
//   OFFER: "OFFER",

//   REPORT: "REPORT",
//   ANALYTICS: "ANALYTICS",

//   NOTIFICATION: "NOTIFICATION",
//   SETTING: "SETTING",

//   COMMISSION: "COMMISSION",
//   WALLET: "WALLET",

//   SUPPORT_TICKET: "SUPPORT_TICKET",

//   AUDIT_LOG: "AUDIT_LOG"
// });