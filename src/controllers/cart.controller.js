
// controllers/cart.controller.js

import Joi from "joi";
import mongoose from "mongoose";

import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";

import { formatCart } from "../utils/formatProduct.js";
import { generateLayerId } from "../utils/rmId.js";

// ─────────────────────────────────────────────
// OBJECT ID VALIDATOR
// ─────────────────────────────────────────────

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }

  return value;
};

// ─────────────────────────────────────────────
// LAYER VALIDATION
// ─────────────────────────────────────────────

const layerSchema = Joi.object({
  id: Joi.string().required(),
  layerId: Joi.string().required(),

  type: Joi.string()
    .valid("text")
    .required(),

  area: Joi.string().required(),

  text: Joi.string().allow(""),

  textMaxLength: Joi.number(),

  fontSizePercent: Joi.number(),

  textWidthPercent: Joi.number(),

  color: Joi.string(),

  fontFamily: Joi.string(),

  bold: Joi.boolean(),

  curved: Joi.boolean(),

  curveRadius: Joi.number(),

  xPercent: Joi.number(),

  yPercent: Joi.number(),

  rotation: Joi.number(),

  image: Joi.object({
    url: Joi.string().allow(null),

    public_id: Joi.string().allow(null),
  }),
});

// ─────────────────────────────────────────────
// ADD VALIDATION
// ─────────────────────────────────────────────

const addItemSchema = Joi.object({
  productId: Joi.string()
    .custom(objectId)
    .required(),

  variantId: Joi.string()
    .custom(objectId)
    .required(),

  qty: Joi.number()
    .integer()
    .min(1)
    .required(),

  layer: layerSchema
    .allow(null)
    .default(null),
});

// ─────────────────────────────────────────────
// UPDATE VALIDATION
// ─────────────────────────────────────────────

const updateItemSchema = Joi.object({
  productId: Joi.string()
    .custom(objectId)
    .required(),

  variantId: Joi.string()
    .custom(objectId)
    .required(),

  qty: Joi.number()
    .integer()
    .min(0)
    .required(),

  layer: layerSchema
    .allow(null)
    .default(null),
});


export const updateLayerSchema = Joi.object({
  productId: Joi.string().required(),
  variantId: Joi.string().required(),
  layerId: Joi.string().required(),
  updates: Joi.object({
    text: Joi.string().allow("").optional(),
    id: Joi.string(),
    color: Joi.string().optional(),
    fontFamily: Joi.string().optional(),
    bold: Joi.boolean().optional(),
    curved: Joi.boolean().optional(),

    curveRadius: Joi.number().min(40).max(300).optional(),

    xPercent: Joi.number().min(0).max(100).optional(),
    yPercent: Joi.number().min(0).max(100).optional(),

    rotation: Joi.number().min(-180).max(180).optional(),

    fontSizePercent: Joi.number().min(0.5).max(10).optional(),

    textWidthPercent: Joi.number().min(0).max(100).optional(),
  })
    .min(1) // at least one field required in updates
    .required(),
});

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const getLayerId = (item) =>
  item?.layer?.id || "";

const getArea = (item) =>
  item?.layer?.area || "";

const getText = (item) =>
  item?.layer?.text
    ?.trim()
    ?.replace(/\s+/g, " ")
    ?.toLowerCase() || "";


export const addToCart = async (
  req,
  res
) => {
  try {
    const { error, value } =
      addItemSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const {
      productId,
      variantId,
      qty,
      layer,
    } = value;

    const customerId = req.user._id;

    // ─────────────────────────

    const product =
      await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const variant =
      product.variants?.id(variantId);

    if (!variant) {
      return res.status(400).json({
        message: "Invalid variant",
      });
    }

    // ─────────────────────────

    let cart = await Cart.findOne({
      customerId,
    });

const newItem = {
  productId,
  variantId,
  qty,
  layer: layer
    ? {
        ...layer,
        layerId: layer.layerId || generateLayerId(),
      }
    : null,
};

    // ─────────────────────────
    // CREATE CART
    // ─────────────────────────

    if (!cart) {
      cart = await Cart.create({
        customerId,
        items: [newItem],
      });
    }

    // ─────────────────────────
    // UPDATE CART
    // ─────────────────────────

    else {
      cart.items = cart.items.filter(
        (i) => i.productId
      );

      // const existing =
      //   cart.items.find((i) => {
      //     return (
      //       i.productId.toString() ===
      //         productId &&
      //       i.variantId.toString() ===
      //         variantId &&
      //       getText(i) ===
      //         getText({
      //           layer,
      //         })
      //     );
      //   });


const existing = cart.items.find((i) => {
  return (
    i.productId.toString() === productId &&
    i.variantId.toString() === variantId &&
    i?.layer?.layerId === layer?.layerId
  );
});

      // SAME ITEM
      if (existing) {
        existing.qty += qty;

        existing.layer = layer;
      }

      // NEW ITEM
      else {
        cart.items.push(newItem);
      }

      await cart.save();
    }

    // ─────────────────────────

    await cart.populate({
      path: "items.productId",

      select:
        "name images variants gstPercent slug customization label",
    });

    return res.json({
      success: true,

      items: formatCart(cart),
    });
  } catch (err) {
    console.error(
      "addToCart error:",
      err
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ─────────────────────────────────────────────
// UPDATE CART ITEM
// ─────────────────────────────────────────────

export const updateCart = async (
  req,
  res
) => {
  try {
      console.log("value",req.body)
    const { error, value } =
      updateItemSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    const {
      productId,
      variantId,
      qty,
      layer,
    } = value;

    const customerId = req.user._id;

  

    // ─────────────────────────

    const cart = await Cart.findOne({
      customerId,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // ─────────────────────────

 const item = cart.items.find(
  (i) =>
    i.productId.toString() === productId &&
    i.variantId.toString() === variantId &&
    i?.layer?.layerId === layer?.layerId
);

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    // REMOVE

    if (qty <= 0) {


cart.items = cart.items.filter(
  (i) =>
    !(
      i.productId.toString() === productId &&
      i.variantId.toString() === variantId &&
      i?.layer?.layerId === layer?.layerId
    )
);
    }

    // UPDATE
    else {
      item.qty = qty;

      item.layer = layer;
    }

    // ─────────────────────────

    await cart.save();

    await cart.populate({
      path: "items.productId",

      select:
        "name images variants gstPercent slug customization label",
    });

    return res.json({
      success: true,

      items: formatCart(cart),
    });
  } catch (err) {
    console.error(
      "updateCart error:",
      err
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};


export const removeFromCart = async (req, res) => {
    try {
      const {
        productId,
        variantId,
        layerId,
      } = req.body;


      console.log("get the data of body",req.body)
      const customerId = req.user._id;

      const cart =
        await Cart.findOne({
          customerId,
        });


            console.log("get the data of cart",cart)

      if (!cart) {
        return res.status(404).json({
          message: "Cart not found",
        });
      }

   cart.items = cart.items.filter((i) => {
  return !(
    String(i.productId) === String(productId) &&
    String(i.variantId) === String(variantId) &&
    String(i.layer?.layerId || "") === String(layerId || "")
  );
});

      await cart.save();

        console.log("get the data of cart afteer detle",cart)

      await cart.populate({
        path: "items.productId",

        select:
          "name images variants gstPercent slug customization label",
      });

      return res.json({
        success: true,

        items: formatCart(cart),
      });
    } catch (err) {
      console.error(
        "removeFromCart error:",
        err
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  };

// ─────────────────────────────────────────────
// GET CART
// ─────────────────────────────────────────────

export const getCart = async (
  req,
  res
) => {
  try {
    const customerId = req.user._id;

    let cart = await Cart.findOne({
      customerId,
    }).populate({
      path: "items.productId",

      select:
        "name images variants gstPercent slug customization label",
    });

    if (!cart) {
      cart = await Cart.create({
        customerId,
        items: [],
      });
    }

    return res.json({
      success: true,

      items: formatCart(cart),
    });
  } catch (err) {
    console.error(
      "getCart error:",
      err
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ─────────────────────────────────────────────
// CLEAR CART
// ─────────────────────────────────────────────

export const clearCart = async (
  req,
  res
) => {
  try {
    const customerId = req.user._id;

    await Cart.findOneAndUpdate(
      { customerId },

      {
        $set: {
          items: [],
        },
      }
    );

    return res.json({
      success: true,

      items: [],
    });
  } catch (err) {
    console.error(
      "clearCart error:",
      err
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateCartLayer = async (req, res) => {
  try {

    // ─────────────────────────────
    // VALIDATION
    // ─────────────────────────────
    const { error, value } = updateLayerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        message: error.details?.[0]?.message || "Invalid request",
      });
    }

    const { productId, variantId, layerId, updates = {} } = value;

    console.log("layerid",layerId)

    const customerId = req.user._id;

    // ─────────────────────────────
    // FIND CART
    // ─────────────────────────────
    const cart = await Cart.findOne({ customerId });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // ─────────────────────────────
    // FIND ITEM
    // ─────────────────────────────
    const item = cart.items.find((i) => {
      return (
        i.productId.toString() === productId &&
        i.variantId.toString() === variantId &&
        i?.layer?.layerId === layerId
      );
    });

    if (!item) {
      return res.status(404).json({
        message: "Cart item not found",
      });
    }

    // ─────────────────────────────
    // ENSURE LAYER EXISTS
    // ─────────────────────────────
    if (!item.layer) {
      item.layer = { layerId };
    }

    // ─────────────────────────────
    // ALLOWED FIELDS (SECURITY)
    // ─────────────────────────────
    const ALLOWED_FIELDS = new Set([
      "text",
      "color",
      "fontFamily",
      "bold",
      "curved",
      "curveRadius",
      "xPercent",
      "yPercent",
      "rotation",
      "fontSizePercent",
      "textWidthPercent",
    ]);

    // ─────────────────────────────
    // SANITIZE INPUT
    // ─────────────────────────────
    const safeUpdates = Object.entries(updates).reduce(
      (acc, [key, value]) => {
        if (ALLOWED_FIELDS.has(key)) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    // ─────────────────────────────
    // MERGE LAYER SAFELY
    // ─────────────────────────────
    item.layer = {
      ...item.layer,
      ...safeUpdates,
      layerId: item.layer.layerId || layerId,
    };

    item.markModified("layer");

    // ─────────────────────────────
    // SAVE CART
    // ─────────────────────────────
    await cart.save();

    // ─────────────────────────────
    // POPULATE FOR RESPONSE
    // ─────────────────────────────
    await cart.populate({
      path: "items.productId",
      select: "name images variants gstPercent slug customization label",
    });

    return res.status(200).json({
      success: true,
      message: "Layer updated successfully",
      items: formatCart(cart),
    });

  } catch (err) {
    console.error("updateCartLayer error:", err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
// export const updateCartLayer = async (req, res) => {
//   try {
//     const { error, value } = updateLayerSchema.validate(req.body);

//     if (error) {
//       return res.status(400).json({
//         message: error.message,
//       });
//     }

//     const { productId, variantId, layerId, updates } = value;

//     const customerId = req.user._id;

//     const cart = await Cart.findOne({ customerId });

//     if (!cart) {
//       return res.status(404).json({
//         message: "Cart not found",
//       });
//     }

//     // ─────────────────────────
//     // FIND ITEM (SAFE CHECK)
//     // ─────────────────────────

//     const item = cart.items.find((i) => {
//       return (
//         i.productId.toString() === productId &&
//         i.variantId.toString() === variantId &&
//         i?.layer?.layerId === layerId
//       );
//     });

//     if (!item) {
//       return res.status(404).json({
//         message: "Item not found for this layer",
//       });
//     }

//     // ─────────────────────────
//     // LAYER CHECK (SAFE GUARD)
//     // ─────────────────────────

//     if (!item.layer) {
//       item.layer = {
//         layerId,
//       };
//     }

//     // ─────────────────────────
//     // UPDATE ONLY VALID FIELDS
//     // ─────────────────────────

//     const allowedFields = [
//       "text",
//       "color",
//       "fontFamily",
//       "bold",
//       "curved",
//       "curveRadius",
//       "xPercent",
//       "yPercent",
//       "rotation",
//       "fontSizePercent",
//       "textWidthPercent",
//     ];

//     Object.keys(updates).forEach((key) => {
//       if (allowedFields.includes(key)) {
//         item.layer[key] = updates[key];
//       }
//     });

//     // never change ID
//     item.layer.layerId = item.layer.layerId || layerId;

//     // ─────────────────────────

//     await cart.save();

//     await cart.populate({
//       path: "items.productId",
//       select: "name images variants gstPercent slug customization",
//     });

//     return res.json({
//       success: true,
//       items: formatCart(cart),
//     });
//   } catch (err) {
//     console.error("updateCartLayer error:", err);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };