/**
 * MR Crafted — Brand tokens & company defaults for email templates.
 * Override any value per-send via template data or env-backed config.
 */

export const BRAND = Object.freeze({
  companyName: "MR Crafted",
  tagline: "Custom Printing & Personalized Products",
  website: "https://mrcrafted.in",
  supportEmail: "mrcrafted2000@gmail.com",
  phone: "+91 9801669387",
  logoUrl: "https://mrcrafted.in/images/logo/mrcrafted.png",
  logoAlt: "MRCrafted",

  colors: Object.freeze({
    primary: "#001234",
    secondary: "#990000",
    background: "#F5F7FA",
    white: "#FFFFFF",
    text: "#333333",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#DC2626",
    info: "#2563EB",
    cardBg: "#FFFFFF",
    heroOverlay: "rgba(0, 18, 52, 0.92)",
  }),

  typography: Object.freeze({
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSizeBase: "15px",
    fontSizeSm: "13px",
    fontSizeXs: "12px",
    fontSizeLg: "18px",
    fontSizeXl: "24px",
    lineHeight: "1.6",
  }),

  layout: Object.freeze({
    maxWidth: "600px",
    borderRadius: "12px",
    borderRadiusSm: "8px",
    borderRadiusLg: "16px",
    padding: "24px",
    paddingSm: "16px",
    paddingLg: "32px",
  }),

  social: Object.freeze({
    facebook: "https://facebook.com/mrcrafted",
    instagram: "https://instagram.com/mrcrafted",
    youtube: "https://youtube.com/@mrcrafted",
    linkedin: "https://linkedin.com/company/mrcrafted",
    whatsapp: "https://wa.me/910000000000",
  }),

  legal: Object.freeze({
    privacyPolicy: "https://mrcrafted.in/privacy-policy",
    termsConditions: "https://mrcrafted.in/terms-and-conditions",
    refundPolicy: "https://mrcrafted.in/refund-policy",
  }),

  paths: Object.freeze({
    login: "/login",
    dashboard: "/dashboard",
    orders: "/orders",
    trackOrder: "/orders/track",
    adminDashboard: "/admin",
    adminEnquiries: "/admin/enquiries",
  }),
});

export const getBrandUrls = (overrides = {}) => {
  const website = overrides.website || BRAND.website;
  const base = website.replace(/\/$/, "");

  return {
    website: base,
    login: `${base}${BRAND.paths.login}`,
    dashboard: `${base}${BRAND.paths.dashboard}`,
    orders: `${base}${BRAND.paths.orders}`,
    trackOrder: `${base}${BRAND.paths.trackOrder}`,
    adminDashboard: overrides.adminPanelUrl
      ? `${overrides.adminPanelUrl.replace(/\/$/, "")}${BRAND.paths.adminDashboard}`
      : `${base}${BRAND.paths.adminDashboard}`,
    adminEnquiries: overrides.adminPanelUrl
      ? `${overrides.adminPanelUrl.replace(/\/$/, "")}${BRAND.paths.adminEnquiries}`
      : `${base}${BRAND.paths.adminEnquiries}`,
    privacyPolicy: BRAND.legal.privacyPolicy,
    termsConditions: BRAND.legal.termsConditions,
    refundPolicy: BRAND.legal.refundPolicy,
  };
};
