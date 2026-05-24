import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
import Joi from "joi";
import mongoose from "mongoose";
import { formatCart } from "../utils/formatProduct.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};

// ─── Validation schemas ─────────────────────────────────────────────────────

const customizationLayerSchema = Joi.object({
  id: Joi.string().optional(),
  type: Joi.string().valid("text", "image").required(),
  area: Joi.string().required(),
  text: Joi.string().allow("").optional(),
  color: Joi.string().allow("").optional(),
  imageUrl: Joi.string().allow("").optional(),
});

const customizationSchema = Joi.object({
  areas: Joi.array().items(Joi.string()).required(),
  layers: Joi.object().pattern(
    Joi.string(),
    Joi.array().items(customizationLayerSchema)
  ).required(),
}).allow(null);

const addItemSchema = Joi.object({
  productId: Joi.string().custom(objectId).required(),
  variantId: Joi.string().custom(objectId).required(),
  qty: Joi.number().integer().min(1).required(),
  customization: customizationSchema.optional().default(null),
});

const updateItemSchema = Joi.object({
  productId: Joi.string().custom(objectId).required(),
  variantId: Joi.string().custom(objectId).required(),
  qty: Joi.number().integer().min(0).required(),
});

// ─── Add To Cart ─────────────────────────────────────────────────────────────

export const addToCart = async (req, res) => {
  try {
    const { error, value } = addItemSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const { productId, variantId, qty, customization } = value;
    const customerId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const variant = product.variants?.id(variantId);
    if (!variant) return res.status(400).json({ message: "Invalid variant" });

    // Build the cart item
    const newCartItem = {
      productId,
      variantId,
      qty,
      ...(customization ? { customization } : {}),
    };

    let cart = await Cart.findOne({ customerId });

    if (!cart) {
      cart = await Cart.create({ customerId, items: [newCartItem] });
    } else {
      // Remove null-productId items (data cleanup)
      cart.items = cart.items.filter((i) => i.productId);

      const existing = cart.items.find(
        (i) =>
          i.productId.toString() === productId &&
          i.variantId.toString() === variantId
      );

      if (existing) {
        existing.qty += qty;
        // Update customization if provided on re-add
        if (customization) existing.customization = customization;
      } else {
        cart.items.push(newCartItem);
      }

      await cart.save();
    }

    await cart.populate({
      path: "items.productId",
      select: "name images variants gstPercent slug customization",
    });

    return res.json({ success: true, items: formatCart(cart) });
  } catch (err) {
    console.error("addToCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Update Cart Item ─────────────────────────────────────────────────────────

export const updateCart = async (req, res) => {
  try {
    const { productId, variantId, qty } = req.body;
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customerId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (i) =>
        i.productId.toString() === productId &&
        i.variantId.toString() === variantId
    );
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (qty <= 0) {
      cart.items = cart.items.filter(
        (i) =>
          !(i.productId.toString() === productId && i.variantId.toString() === variantId)
      );
    } else {
      item.qty = qty;
    }

    await cart.save();
    await cart.populate({
      path: "items.productId",
      select: "name images variants gstPercent slug customization",
    });

    return res.json({ success: true, items: formatCart(cart) });
  } catch (err) {
    console.error("updateCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Remove From Cart ─────────────────────────────────────────────────────────

export const removeFromCart = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customerId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (i) =>
        !(i.productId.toString() === productId && i.variantId.toString() === variantId)
    );

    await cart.save();
    await cart.populate({
      path: "items.productId",
      select: "name images variants gstPercent slug customization",
    });

    return res.json({ success: true, items: formatCart(cart) });
  } catch (err) {
    console.error("removeFromCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Get Cart ─────────────────────────────────────────────────────────────────

export const getCart = async (req, res) => {
  try {
    const customerId = req.user._id;

    let cart = await Cart.findOne({ customerId }).populate({
      path: "items.productId",
      select: "name images variants gstPercent slug customization",
    });

    if (!cart) {
      cart = await Cart.create({ customerId, items: [] });
    }

    return res.json({ success: true, items: formatCart(cart) });
  } catch (err) {
    console.error("getCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Clear Cart ───────────────────────────────────────────────────────────────

export const clearCart = async (req, res) => {
  try {
    const customerId = req.user._id;
    await Cart.findOneAndUpdate({ customerId }, { items: [] });
    return res.json({ success: true, items: [] });
  } catch (err) {
    console.error("clearCart error:", err);
    res.status(500).json({ message: "Server error" });
  }
};