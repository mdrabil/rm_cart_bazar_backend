// import Cart from "../models/Cart.model.js";
// import Product from "../models/Product.model.js";
// import Joi from "joi";
// import mongoose from "mongoose";
// import { formatCart } from "../utils/formatProduct.js";

// // ─────────────────────────────
// // ObjectId validator
// // ─────────────────────────────
// const objectId = (value, helpers) => {
//   if (!mongoose.Types.ObjectId.isValid(value)) {
//     return helpers.message("Invalid ObjectId");
//   }
//   return value;
// };

// // ─────────────────────────────
// // Layer Schema (SINGLE LAYER ONLY)
// // ─────────────────────────────
// const layerSchema = Joi.object({
//   id: Joi.string().required(),
//   type: Joi.string().valid("text").required(),
//   area: Joi.string().required(),
// textMaxLength: Joi.number(),
// fontSizePercent: Joi.number(),
// textWidthPercent: Joi.number(),
//   text: Joi.string().allow(""),
//   color: Joi.string(),
//   fontFamily: Joi.string(),
//   bold: Joi.boolean(),
//   curved: Joi.boolean(),
//   curveRadius: Joi.number(),
//   xPercent: Joi.number(),
//   yPercent: Joi.number(),
//   rotation: Joi.number(),

//   image: Joi.object({
//     url: Joi.string().allow(null),
//     public_id: Joi.string().allow(null),
//   }),
// });

// // ─────────────────────────────
// // Customization (ONLY ONE LAYER)
// // ─────────────────────────────
// const customizationSchema = Joi.object({
//   layer: layerSchema.required(),
// }).allow(null);

// // ─────────────────────────────
// // Add Item Validation
// // ─────────────────────────────
// export const addItemSchema = Joi.object({
//   productId: Joi.string().custom(objectId).required(),
//   variantId: Joi.string().custom(objectId).required(),
//   qty: Joi.number().integer().min(1).required(),
//   customization: customizationSchema.default(null),
// });

// // ─────────────────────────────
// // UPDATE VALIDATION
// // ─────────────────────────────
// const updateItemSchema = Joi.object({
//   productId: Joi.string().custom(objectId).required(),
//   variantId: Joi.string().custom(objectId).required(),
//   qty: Joi.number().integer().min(0).required(),
//   customization: customizationSchema.default(null),
// });

// // ─────────────────────────────
// // MATCH HELPER (IMPORTANT)
// // ─────────────────────────────
// const getArea = (item) =>
//   item?.customization?.layer?.area || "";

// // ─────────────────────────────
// // ADD TO CART
// // ─────────────────────────────
// export const addToCart = async (req, res) => {
//   try {
//     const { error, value } = addItemSchema.validate(req.body);
//     if (error) return res.status(400).json({ message: error.message });

//     const { productId, variantId, qty, customization } = value;
//     const customerId = req.user._id;

//     const product = await Product.findById(productId);
//     if (!product) return res.status(404).json({ message: "Product not found" });

//     const variant = product.variants?.id(variantId);
//     if (!variant) return res.status(400).json({ message: "Invalid variant" });

//     let cart = await Cart.findOne({ customerId });

//     const newItem = {
//       productId,
//       variantId,
//       qty,
//       customization,
//     };

//     if (!cart) {
//       cart = await Cart.create({
//         customerId,
//         items: [newItem],
//       });
//     } else {
//       // cleanup
//       cart.items = cart.items.filter((i) => i.productId);

//       const newArea = customization?.layer?.area || "";

//       const existing = cart.items.find((i) => {
//         return (
//           i.productId.toString() === productId &&
//           i.variantId.toString() === variantId &&
//           getArea(i) === newArea
//         );
//       });

//       if (existing) {
//         existing.qty += qty;
//         existing.customization = customization; // overwrite latest design
//       } else {
//         cart.items.push(newItem);
//       }

//       await cart.save();
//     }

//     await cart.populate({
//       path: "items.productId",
//       select: "name images variants gstPercent slug customization",
//     });

//     return res.json({
//       success: true,
//       items: formatCart(cart),
//     });
//   } catch (err) {
//     console.error("addToCart error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────
// // UPDATE CART ITEM
// // ─────────────────────────────
// export const updateCart = async (req, res) => {
//   try {
//     const { productId, variantId, qty, customization } = req.body;
//     const customerId = req.user._id;

//     const cart = await Cart.findOne({ customerId });
//     if (!cart) return res.status(404).json({ message: "Cart not found" });

//     const item = cart.items.find((i) => {
//       return (
//         i.productId.toString() === productId &&
//         i.variantId.toString() === variantId &&
//         getArea(i) === getArea({ customization })
//       );
//     });

//     if (!item) return res.status(404).json({ message: "Item not found" });

//     if (qty <= 0) {
//       cart.items = cart.items.filter(
//         (i) =>
//           !(
//             i.productId.toString() === productId &&
//             i.variantId.toString() === variantId &&
//             getArea(i) === getArea({ customization })
//           )
//       );
//     } else {
//       item.qty = qty;
//       item.customization = customization;
//     }

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
//     console.error("updateCart error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────
// // REMOVE ITEM
// // ─────────────────────────────
// export const removeFromCart = async (req, res) => {
//   try {
//     const { productId, variantId, area } = req.body;
//     const customerId = req.user._id;



//     const cart = await Cart.findOne({ customerId });
//     if (!cart) return res.status(404).json({ message: "Cart not found" });

//     cart.items = cart.items.filter(
//       (i) =>
//         !(
//           i.productId.toString() === productId &&
//           i.variantId.toString() === variantId &&
//           getArea(i) === area
//         )
//     );

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
//     console.error("removeFromCart error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────
// // GET CART
// // ─────────────────────────────
// export const getCart = async (req, res) => {
//   try {
//     const customerId = req.user._id;

//     let cart = await Cart.findOne({ customerId }).populate({
//       path: "items.productId",
//       select: "name images variants gstPercent slug customization",
//     });

//     if (!cart) {
//       cart = await Cart.create({ customerId, items: [] });
//     }

//     return res.json({
//       success: true,
//       items: formatCart(cart),
//     });
//   } catch (err) {
//     console.error("getCart error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// // ─────────────────────────────
// // CLEAR CART
// // ─────────────────────────────
// export const clearCart = async (req, res) => {
//   try {
//     const customerId = req.user._id;
//     await Cart.findOneAndUpdate(
//       { customerId },
//       { $set: { items: [] } }
//     );

//     return res.json({
//       success: true,
//       items: [],
//     });
//   } catch (err) {
//     console.error("clearCart error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


// controllers/cart.controller.js

import Joi from "joi";
import mongoose from "mongoose";

import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";

import { formatCart } from "../utils/formatProduct.js";

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

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const getLayerId = (item) =>
  item?.layer?.id || "";

const getArea = (item) =>
  item?.layer?.area || "";

// ─────────────────────────────────────────────
// ADD TO CART
// ─────────────────────────────────────────────

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
      layer,
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

      const existing =
        cart.items.find((i) => {
          return (
            i.productId.toString() ===
              productId &&
            i.variantId.toString() ===
              variantId &&
            getLayerId(i) ===
              getLayerId({
                layer,
              })
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
        "name images variants gstPercent slug customization",
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
        i.productId.toString() ===
          productId &&
        i.variantId.toString() ===
          variantId &&
        getLayerId(i) ===
          getLayerId({
            layer,
          })
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
            i.productId.toString() ===
              productId &&
            i.variantId.toString() ===
              variantId &&
            getLayerId(i) ===
              getLayerId({
                layer,
              })
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
        "name images variants gstPercent slug customization",
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

// ─────────────────────────────────────────────
// REMOVE ITEM
// ─────────────────────────────────────────────

export const removeFromCart = async (req, res) => {
    try {
      const {
        productId,
        variantId,
        layerId,
      } = req.body;

      const customerId = req.user._id;

      const cart =
        await Cart.findOne({
          customerId,
        });

      if (!cart) {
        return res.status(404).json({
          message: "Cart not found",
        });
      }

      cart.items = cart.items.filter(
        (i) =>
          !(
            i.productId.toString() ===
              productId &&
            i.variantId.toString() ===
              variantId &&
            getLayerId(i) === layerId
          )
      );

      await cart.save();

      await cart.populate({
        path: "items.productId",

        select:
          "name images variants gstPercent slug customization",
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
        "name images variants gstPercent slug customization",
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