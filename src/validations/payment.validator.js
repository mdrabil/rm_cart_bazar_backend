import Joi from "joi";
import { PAYMENT_METHODS, PAYMENT_STATUS } from "../models/Payment.model.js";

// ✅ Validation for creating a payment
export const createPaymentSchema = Joi.object({
  order: Joi.string().required(),
  amount: Joi.number().required(),
  method: Joi.string().valid(...Object.values(PAYMENT_METHODS)).required(),
  transactionId: Joi.string().required(),
  status: Joi.string().valid(...Object.values(PAYMENT_STATUS)),
  customer: Joi.object({
    name: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
  }).optional(),
  gatewayResponse: Joi.object().optional(),
});

// ✅ Validation for updating payment status
export const updatePaymentStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(PAYMENT_STATUS)).required(),
});
