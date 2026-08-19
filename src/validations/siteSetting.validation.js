import Joi from "joi";

// Loose but safe regexes - reject obviously bad input without being overly strict
const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const PHONE = /^[+]?[0-9\s\-().]{7,20}$/;
const URL_REGEX = /^https?:\/\/.+/i;

const themeSchema = Joi.object({
  primary: Joi.string().pattern(HEX_COLOR).messages({
    "string.pattern.base": "Primary color must be a valid hex code (e.g. #790D0D)",
  }),
  secondary: Joi.string().pattern(HEX_COLOR).messages({
    "string.pattern.base": "Secondary color must be a valid hex code (e.g. #001234)",
  }),
  accent: Joi.string().pattern(HEX_COLOR).messages({
    "string.pattern.base": "Accent color must be a valid hex code (e.g. #F4B400)",
  }),
}).unknown(false);

const contactSchema = Joi.object({
  email: Joi.string().email({ tlds: false }).allow("").messages({
    "string.email": "Please provide a valid email address",
  }),
  phone: Joi.string().pattern(PHONE).allow("").messages({
    "string.pattern.base": "Please provide a valid phone number",
  }),
  address: Joi.string().max(300).allow(""),
}).unknown(false);

const socialSchema = Joi.object({
  facebook: Joi.string().pattern(URL_REGEX).allow("").messages({
    "string.pattern.base": "Facebook link must be a valid URL",
  }),
  instagram: Joi.string().pattern(URL_REGEX).allow("").messages({
    "string.pattern.base": "Instagram link must be a valid URL",
  }),
  linkedin: Joi.string().pattern(URL_REGEX).allow("").messages({
    "string.pattern.base": "LinkedIn link must be a valid URL",
  }),
  twitter: Joi.string().pattern(URL_REGEX).allow("").messages({
    "string.pattern.base": "Twitter/X link must be a valid URL",
  }),
  youtube: Joi.string().pattern(URL_REGEX).allow("").messages({
    "string.pattern.base": "YouTube link must be a valid URL",
  }),
}).unknown(false);

// Top level payload validation. All sections are optional except companyName
// so that partial updates (PATCH-style "update only changed fields") work
// through the same endpoint.
export const settingValidation = Joi.object({
  companyName: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Company name is required",
    "string.min": "Company name must be at least 2 characters",
    "any.required": "Company name is required",
  }),
  theme: themeSchema,
  contact: contactSchema,
  social: socialSchema,
  // branding is written internally by the controller from uploaded files,
  // never trusted directly from the client body
}).unknown(false);
