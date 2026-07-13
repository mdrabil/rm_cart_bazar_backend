import Joi from "joi";
import mongoose from "mongoose";

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};


const layerSchema = Joi.object({
  id: Joi.string().optional(),

  type: Joi.string().optional(),

  area: Joi.string().optional(),

  text: Joi.string().allow("").optional(),

  textMaxLength: Joi.number().optional(),

  fontSizePercent: Joi.number().optional(),

  textWidthPercent: Joi.number().optional(),

  color: Joi.string().optional(),

  fontFamily: Joi.string().optional(),

  bold: Joi.boolean().optional(),

  curved: Joi.boolean().optional(),

  curveRadius: Joi.number().optional(),

  xPercent: Joi.number().optional(),

  yPercent: Joi.number().optional(),

  rotation: Joi.number().optional(),

  image: Joi.object({
    url: Joi.string().optional(),
    public_id: Joi.string().optional(),
  }).optional(),

  layerId: Joi.string().optional(),
});


const guestCartItemSchema = Joi.object({
  productId: Joi.string().required(),

  variantId: Joi.string().allow(null, "").optional(),

  qty: Joi.number()
    .integer()
    .min(1)
    .default(1),

  layer: layerSchema.optional().allow(null),
});


export const customerValidator = Joi.object({

  name: Joi.string()
    .required(),

  mobile: Joi.string()
    .required(),

  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(6)
    .required(),

  guestCart: Joi.array()
    .items(guestCartItemSchema)
    .optional()
    .default([]),

});

// export const customerValidator = Joi.object({
//   name: Joi.string().min(2).required(),
//   mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
//   email: Joi.string().email().optional(),
//   password: Joi.string().min(6).required(),
//     guestCart: Joi.array()
//     .items(
//       Joi.object({
//         productId: Joi.string().custom(objectId).required(),
//         variantId: Joi.string().custom(objectId).required(),
//         qty: Joi.number().integer().min(1).required(),
//       })
//     )
//     .optional()
//     .default([]),

// });