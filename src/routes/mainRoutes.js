import express from "express";
import authRoutes from "./auth.routes.js";
import adminUserRoutes from "./admin/user.routes.js";
import storeRoutes from "./admin/store.routes.js";
import staffRoutes from "./admin/storeStaff.routes.js";
import categoryRoutes from "./admin/category.routes.js";
import productRoutes from "./admin/product.routes.js";
import publicProductRoutes from "./customer/customer.product.routes.js";
import adminOrderRoutes from "./admin/order.routes.js";
import permissionRoutes from "./admin/permission.routes.js";
import roleRoutes from "./admin/role.routes.js";
import CouponRoutes from "./admin/coupon.routes.js";
import customerAuthRoutes from "./customer/auth.routes.js";
import customerRoutes from "./admin/customer.routes.js";
import cartRoutes from "./customer/cart.routes.js";
import customerOrdersRoutes from "./customer/customer.order.routes.js";
import wishListRoutes from "./customer/wishlist.routes.js";
import blogsRoutes from "../routes/blog.routes.js";
// import cmsPageRoutes from "../routes/cmsPage.routes.js";
import HomePageRoutes from "../routes/homePage.routes.js";
import ContactUsRoutes from "../routes/contact.routes.js";
import JobRoutes from "../routes/job.routes.js";
import CmsRoutes from "../routes/cms.routes.js";
import FaqRoutes from "../routes/faq.routes.js";
import TestimonialRoutes from "../routes/testimonial.routes.js";
import moduleRoutes from "../routes/admin/module.routes.js";
import enquiryRoutes from "../routes/enquiry.routes.js";
import BannerRoutes from "../routes/banner.routes.js";
import AnalyticsRoutes from "../routes/analytics.routes.js";
import paymentRoutes from "../payment/routes.js";
import paymentGatewayRoutes from "./admin/paymentGateway.routes.js";
import singleRoutes from "../routes/admin/single.routes.js";
import languagePreferenceAdminRoutes from "./admin/languagePreference.routes.js";
import AppVersionRoutes from "./appVersion.routes.js";
import Maintenance from "./maintenance.routes.js";
import trafficRoutes from "../routes/trafficRoutes.js";
import messageProviderRoutes from "../routes/admin/messageProvider.routes.js";



const router = express.Router();

/* ===================== PUBLIC ROUTES ===================== */
// No auth required for login / signup
console.log("Auth mounted on /auth");
router.use("/auth", authRoutes);
router.use("/customer/auth", customerAuthRoutes);
router.use("/public/products", publicProductRoutes);
router.use("/public/coupon", publicProductRoutes);
router.use("/customer/orders", customerOrdersRoutes);
router.use("/customer/wishlist", wishListRoutes);
router.use("/blogs", blogsRoutes);
router.use("/payment", paymentRoutes);
router.use("/traffic", trafficRoutes);
router.use("/app-version", AppVersionRoutes);
router.use("/maintenance", Maintenance);
// router.use("/admin/cms", cmsPageRoutes);
router.use("/admin/contact", ContactUsRoutes);
router.use("/jobs", JobRoutes);
router.use("/admin/homepage", HomePageRoutes);
router.use("/admin/faq", FaqRoutes);
router.use("/admin/testimonials", TestimonialRoutes);
router.use("/cart", cartRoutes);
router.use("/banner",BannerRoutes );
router.use("/admin/cms", CmsRoutes);
router.use("/admin/enquiries", enquiryRoutes);
/* ===================== PROTECTED ROUTES ===================== */
// Apply auth + store-access middleware globally for admin routes
// router.use("/admin", authMiddleware, getUserStores);

// Now all /admin/... routes automatically have req.user + req.allowedStores
router.use("/admin/users", adminUserRoutes);
router.use("/admin/message-provider", messageProviderRoutes);
router.use("/admin/payment-gateways", paymentGatewayRoutes);
router.use("/admin/single", singleRoutes);
router.use("/admin/analytics", AnalyticsRoutes);
router.use("/admin/modules",moduleRoutes );
router.use("/admin/stores", storeRoutes);
router.use("/admin/coupons", CouponRoutes);
router.use("/admin/store-staff", staffRoutes);
router.use("/admin/categories", categoryRoutes);

router.use("/admin/products", productRoutes);
router.use("/admin/orders", adminOrderRoutes);
router.use("/admin/module-permissions", permissionRoutes);
router.use("/admin/roles", roleRoutes);
router.use("/admin/customers", customerRoutes);
router.use("/admin/language-preferences", languagePreferenceAdminRoutes);

export default router;
