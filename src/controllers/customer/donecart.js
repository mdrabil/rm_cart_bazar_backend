import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
import Joi from "joi";
import mongoose from "mongoose";
import { USER_ROLE } from "../constants/enums.js";
import { formatCart } from "../utils/formatProduct.js";

/* ------------------- Helpers ------------------- */

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};

/* ------------------- Validation Schemas ------------------- */

const addItemSchema = Joi.object({
  productId: Joi.string().custom(objectId).required(),
  variantId: Joi.string().custom(objectId).required(),
  qty: Joi.number().integer().min(1).required(),
});

const updateItemSchema = Joi.object({
  productId: Joi.string().custom(objectId).required(),
  variantId: Joi.string().custom(objectId).required(),
  qty: Joi.number().integer().min(0).required(),
});

/* ------------------- Add To Cart ------------------- */

export const addToCart = async (req, res) => {
  try {
    const { error, value } = addItemSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.message });

    const { productId, variantId, qty } = value;
    const customerId = req.user._id;

    // console.log("get the data ",customerId)

    const product = await Product.findById(productId);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    const variant = product.variants.id(variantId);
    if (!variant)
      return res.status(400).json({ message: "Invalid variant" });

    let cart = await Cart.findOne({ customerId });

    if (!cart) {
      cart = await Cart.create({
        customerId,
        items: [{ productId, variantId, qty }],
      });
    } else {
      const existing = cart.items.find(
        i =>
          i.productId.toString() === productId &&
          i.variantId.toString() === variantId
      );

      if (existing) existing.qty += qty;
      else cart.items.push({ productId, variantId, qty });

      await cart.save();
    }

    await cart.populate({
      path: "items.productId",
      select: "name images variants gstPercent",
    });

    return res.json({
      success: true,
      items: formatCart(cart),
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ------------------- Update Cart Item ------------------- */

export const updateCartItem = async (req, res) => {
  try {
 
    const { error, value } = updateItemSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.message });

    const { productId, variantId, qty } = value;
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customerId });
    if (!cart)
      return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productId &&
        item.variantId.toString() === variantId
    );

    if (itemIndex === -1)
      return res.status(404).json({ message: "Item not in cart" });

    if (qty === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].qty = qty;
    }

    await cart.save();

    return res.json({ success: true, cart });
  } catch (err) {
    console.error("updateCartItem:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCart = async (req, res) => {
  try {
    const { productId, variantId, qty } = req.body;
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customerId });
    if (!cart)
      return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (i) =>
        i.productId.toString() === productId &&
        i.variantId.toString() === variantId
    );

    if (!item)
      return res.status(404).json({ message: "Item not found" });

    if (qty <= 0) {
      cart.items = cart.items.filter(
        (i) =>
          !(
            i.productId.toString() === productId &&
            i.variantId.toString() === variantId
          )
      );
    } else {
      item.qty = qty;
    }

    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "name images variants gstPercent",
    });

    return res.json({
      success: true,
      items: formatCart(cart),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
/* ------------------- Remove From Cart ------------------- */

export const removeFromCart = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const customerId = req.user._id;

    const cart = await Cart.findOne({ customerId });
    if (!cart)
      return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (i) =>
        !(
          i.productId.toString() === productId &&
          i.variantId.toString() === variantId
        )
    );

    await cart.save();

    await cart.populate({
      path: "items.productId",
      select: "name images variants gstPercent",
    });

    return res.json({
      success: true,
      items: formatCart(cart),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



export const getCart = async (req, res) => {
  try {
    const customerId = req.user._id;

    let cart = await Cart.findOne({ customerId }).populate({
      path: "items.productId",
      select: "name images variants gstPercent",
    });

    if (!cart) {
      cart = await Cart.create({ customerId, items: [] });
    }

    return res.json({
      success: true,
      items: formatCart(cart),
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
/* ------------------- Clear Cart ------------------- */
export const clearCart = async (req, res) => {
  try {
    const customerId = req.user._id;

    await Cart.findOneAndUpdate(
      { customerId },
      { items: [] }
    );

    return res.json({
      success: true,
      items: [],
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};