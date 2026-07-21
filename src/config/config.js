import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("❌ MONGO_URI is not defined in environment variables");
}
if (!process.env.JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is not defined in environment variables");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("❌ JWT_REFRESH_SECRET is not defined in environment variables");
}

// const parseCorsOrigins = () => {
//   const raw = process.env.CORS_ORIGINS;
//   if (!raw || raw === "*") return true;
//   return raw.split(",").map((o) => o.trim()).filter(Boolean);
// };


const parseCorsOrigins = () => {
  // Development → allow all origins
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  // Production → only whitelisted domains
  const raw = process.env.CORS_ORIGINS;

  if (!raw) {
    throw new Error(
      "❌ CORS_ORIGINS is required in production environment"
    );
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};
export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 8080,
  mongoURI: process.env.MONGO_URI,
  mongoTls: process.env.MONGO_TLS !== "false",
  mongoTlsAllowInvalid: process.env.MONGO_TLS_ALLOW_INVALID !== "false",

  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES || "7d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT) || 12,

  corsOrigins: parseCorsOrigins(),

  emailUser: process.env.EMAIL_USER,
  // Gmail App Passwords are often copied with spaces — strip them
  emailPass: (process.env.EMAIL_PASS || "").replace(/\s+/g, "").trim(),
  smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpTlsRejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
  emailSendTimeoutMs: Number(process.env.EMAIL_SEND_TIMEOUT_MS) || 15000,
  adminPanelUrl: (process.env.ADMIN_PANEL_URL || "http://localhost:5173").replace(/\/$/, ""),
  websiteUrl: (process.env.WEBSITE_URL || process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, ""),
  apiPublicUrl: (process.env.API_PUBLIC_URL || "http://localhost:4001").replace(/\/$/, ""),
  paymentWebhookBaseUrl: (process.env.PAYMENT_WEBHOOK_BASE_URL || process.env.API_PUBLIC_URL || "")
    .replace(/\/$/, ""),
  appPaymentScheme: process.env.APP_PAYMENT_SCHEME || "mrcrafted",
  appPaymentSchemes: (process.env.APP_PAYMENT_SCHEMES || "mrcrafted,exp")
    .split(",")
    .map((scheme) => scheme.trim())
    .filter(Boolean),
  passwordResetExpiresMs: Number(process.env.PASSWORD_RESET_EXPIRES_MS) || 60 * 60 * 1000,
  cloudName: process.env.CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  fullName: process.env.SUPER_ADMIN_NAME,
  email: process.env.SUPER_ADMIN_EMAIL,
  mobile: process.env.SUPER_ADMIN_MOBILE,
  password: process.env.SUPER_ADMIN_PASSWORD,
};
