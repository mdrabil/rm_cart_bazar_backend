import mongoose from "mongoose";

/**
 * Reusable sub-schema for any Cloudinary-hosted image
 * (logos, favicon, splash screens, etc.)
 */
const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },
    public_id: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const SiteSettingSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    branding: {
      website: {
        logo: { type: imageSchema, default: () => ({}) },
        footerLogo: { type: imageSchema, default: () => ({}) },
        favicon: { type: imageSchema, default: () => ({}) },
        loadingLogo: { type: imageSchema, default: () => ({}) },
      },
      app: {
        logo: { type: imageSchema, default: () => ({}) },
        footerLogo: { type: imageSchema, default: () => ({}) },
        splashLogo: { type: imageSchema, default: () => ({}) },
        loadingLogo: { type: imageSchema, default: () => ({}) },
      },
      admin: {
        logo: { type: imageSchema, default: () => ({}) },
        footerLogo: { type: imageSchema, default: () => ({}) },
        loadingLogo: { type: imageSchema, default: () => ({}) },
      },
    },

    theme: {
      primary: { type: String, default: "#790D0D", trim: true },
      secondary: { type: String, default: "#001234", trim: true },
      accent: { type: String, default: "#F4B400", trim: true },
    },

    contact: {
      email: { type: String, default: "", lowercase: true, trim: true },
      phone: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
    },

    social: {
      facebook: { type: String, default: "", trim: true },
      instagram: { type: String, default: "", trim: true },
      linkedin: { type: String, default: "", trim: true },
      twitter: { type: String, default: "", trim: true },
      youtube: { type: String, default: "", trim: true },
    },

    // Bumped on every successful save - lets clients cache-bust / detect changes
    version: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Guarantee only one settings document can ever exist in the collection.
// A partial unique index on a constant field is the simplest way to
// enforce a true singleton at the database level.
SiteSettingSchema.index(
  { isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

export default mongoose.model("SiteSetting", SiteSettingSchema);
