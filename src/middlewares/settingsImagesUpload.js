import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";

// All logo/branding field names accepted by the settings endpoint.
// Keep this list in one place - it's reused by the controller's logo map.
export const SETTINGS_IMAGE_FIELDS = [
  "websiteLogo",
  "websiteFooterLogo",
  "websiteFavicon",
  "websiteLoadingLogo",
  "appLogo",
  "appFooterLogo",
  "appSplashLogo",
  "appLoadingLogo",
  "adminLogo",
  "adminFooterLogo",
  "adminLoadingLogo",
];

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "settings",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "ico", "svg"],
    // Prevent filename collisions across different admins uploading at once
    public_id: (req, file) =>
      `${file.fieldname}-${Date.now()}`,
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }
  cb(new Error(`Invalid file type for ${file.fieldname}. Only images are allowed.`));
};

export const settingsImagesUpload = () =>
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per file
    },
  }).fields(SETTINGS_IMAGE_FIELDS.map((name) => ({ name, maxCount: 1 })));
