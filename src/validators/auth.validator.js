import Joi from "joi";

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
});

export const verifyResetTokenSchema = Joi.object({
  token: Joi.string().min(32).required().messages({
    "any.required": "Reset token is required",
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().min(32).required(),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Password must be at least 8 characters",
    "any.required": "Password is required",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Please confirm your password",
  }),
});

export const registerUserSchema = Joi.object({
  fullName: Joi.string().required(),
  email: Joi.string().email(),
  mobile: Joi.string().required(),
  password: Joi.string().min(6).required(),
  roles: Joi.array()
    .items(
      Joi.string().valid(
        "SUPER_ADMIN",
        "VENDOR",
        "STORE_MANAGER",
        "CHEF",
        "RIDER",
        "CUSTOMER"
      )
    )
    .default(["CUSTOMER"]),
});
