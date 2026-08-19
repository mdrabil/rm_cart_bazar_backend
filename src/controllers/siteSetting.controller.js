import cloudinary from "../config/cloudinaryConfig.js";
import SiteSetting from "../models/SiteSetting.js";
import { settingValidation } from "../validations/siteSetting.validation.js";

// Maps a multipart field name -> dot path inside the settings document
const LOGO_FIELD_MAP = {
  websiteLogo: "branding.website.logo",
  websiteFooterLogo: "branding.website.footerLogo",
  websiteFavicon: "branding.website.favicon",
  websiteLoadingLogo: "branding.website.loadingLogo",

  appLogo: "branding.app.logo",
  appFooterLogo: "branding.app.footerLogo",
  appSplashLogo: "branding.app.splashLogo",
  appLoadingLogo: "branding.app.loadingLogo",

  adminLogo: "branding.admin.logo",
  adminFooterLogo: "branding.admin.footerLogo",
  adminLoadingLogo: "branding.admin.loadingLogo",
};

/**
 * Text fields (theme/contact/social) travel as JSON strings inside
 * multipart/form-data. Safely parse whichever of them were sent,
 * leaving the rest untouched so partial updates keep working.
 */
const parseJsonField = (raw, fieldName) => {
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON payload for "${fieldName}"`);
  }
};

const getNested = (obj, path) =>
  path.split(".").reduce((acc, key) => acc?.[key], obj);

const setNested = (obj, path, value) => {
  const keys = path.split(".");
  let current = obj;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      current[key] = value;
    } else {
      current[key] = current[key] || {};
      current = current[key];
    }
  });
};

// ======================================
// GET SETTINGS (public)
// ======================================
export const getSettings = async (req, res) => {
  try {
    const settings = await SiteSetting.findOne({ isActive: true }).select("-__v");

    return res.status(200).json({
      success: true,
      data: settings || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load settings",
    });
  }
};

// ======================================
// CREATE OR UPDATE SETTINGS (admin)
// Single endpoint - creates the singleton document if it doesn't exist yet,
// otherwise patches only the fields that were actually sent.
// ======================================
export const createOrUpdateSettings = async (req, res) => {
  // Track any Cloudinary uploads made by multer so we can roll them back
  // if validation fails or the DB write errors out after the fact.
  const uploadedFiles = req.files ? Object.values(req.files).flat() : [];

  try {
    let { companyName, theme, contact, social } = req.body;

    try {
      theme = parseJsonField(theme, "theme");
      contact = parseJsonField(contact, "contact");
      social = parseJsonField(social, "social");
    } catch (parseErr) {
      await rollbackUploads(uploadedFiles);
      return res.status(400).json({ success: false, message: parseErr.message });
    }

    const payload = { companyName };
    if (theme !== undefined) payload.theme = theme;
    if (contact !== undefined) payload.contact = contact;
    if (social !== undefined) payload.social = social;

    const { error, value } = settingValidation.validate(payload, {
      abortEarly: false,
      allowUnknown: false,
    });

    if (error) {
      await rollbackUploads(uploadedFiles);
      return res.status(400).json({
        success: false,
        errors: error.details.map((e) => e.message),
      });
    }

    let settings = await SiteSetting.findOne({ isActive: true });
    const isNew = !settings;

    if (isNew) {
      settings = new SiteSetting({ companyName: value.companyName });
    } else {
      settings.companyName = value.companyName;
    }

    // Merge only the nested keys that were actually provided, so a partial
    // update (e.g. just the theme) never wipes out unrelated data.
    if (value.theme) {
      settings.theme = { ...settings.theme?.toObject?.() ?? settings.theme, ...value.theme };
    }
    if (value.contact) {
      settings.contact = { ...settings.contact?.toObject?.() ?? settings.contact, ...value.contact };
    }
    if (value.social) {
      settings.social = { ...settings.social?.toObject?.() ?? settings.social, ...value.social };
    }

    // Apply uploaded logos, replacing old Cloudinary assets as needed
    if (req.files) {
      for (const field of Object.keys(req.files)) {
        const path = LOGO_FIELD_MAP[field];
        if (!path) continue;

        const file = req.files[field][0];
        const oldImage = getNested(settings.toObject ? settings.toObject() : settings, path);

        // Delete the previous image from Cloudinary before saving the new one
        if (oldImage?.public_id) {
          try {
            await cloudinary.uploader.destroy(oldImage.public_id);
          } catch {
            // Non-fatal: stale Cloudinary asset is preferable to blocking the save
          }
        }

        setNested(settings, path, {
          url: file.path,
          public_id: file.filename,
        });
      }
    }
    // Logos not present in req.files are left completely untouched,
    // preserving whatever was previously saved.

    settings.version = (settings.version || 1) + (isNew ? 0 : 1);
    settings.isActive = true;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings saved successfully",
      data: settings,
    });
  } catch (error) {
    await rollbackUploads(uploadedFiles);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save settings",
    });
  }
};

// Best-effort cleanup of any Cloudinary uploads for a request that ultimately failed
async function rollbackUploads(files) {
  await Promise.all(
    files.map((f) =>
      f.filename ? cloudinary.uploader.destroy(f.filename).catch(() => {}) : Promise.resolve()
    )
  );
}
