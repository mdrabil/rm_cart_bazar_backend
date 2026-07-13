/**
 * Store-specific order fulfillment after verified payment.
 * When reusing this payment module in another project, replace this file
 * with your own cart → order logic, or call your order service from index.js.
 */
import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/enums.js";
import { generateMRId } from "../utils/mrId.js";
import Cart from "../models/Cart.model.js";
import Coupon from "../models/Coupon.model.js";
import CouponUsage from "../models/CouponUsage.model.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.model.js";
import Payment from "../models/Payment.model.js";
import Product from "../models/Product.model.js";
import StoreModel from "../models/Store.model.js";
import PaymentCheckoutSession, {
  CHECKOUT_SESSION_STATUS,
} from "../models/PaymentCheckoutSession.model.js";

export async function calculateCartTotals(customerId, couponCode, session = null) {
  const cartQuery = Cart.findOne({ customerId }).populate("items.productId");

  if (session) cartQuery.session(session);

  const cart = await cartQuery;

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  let totalAmount = 0;
  let gstAmount = 0;
  let discountAmount = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.productId;

    if (!product) {
      throw new Error("Product not found in cart");
    }

    const variant = product.variants.id(item.variantId);

    if (!variant || !variant.isActive) {
      throw new Error(`Variant not available for ${product.name}`);
    }

    const qty = Number(item.qty) || 0;
    const price = Number(variant.sellingPrice) || 0;

    if (price <= 0 || qty <= 0) {
      throw new Error("Invalid price or quantity");
    }

    if (variant.stockQty < qty) {
      throw new Error(`${product.name} (${variant.value}) out of stock`);
    }

    const itemTotal = price * qty;
    const itemGST = (itemTotal * Number(product.gstPercent || 0)) / 100;

    totalAmount += itemTotal;
    gstAmount += itemGST;

    const layer = item.layer
      ? {
          ...(item.layer.toObject?.() || item.layer),
          isCustomized: !!item.layer?.text?.trim(),
        }
      : {
          area: "none",
          isCustomized: false,
          image:
            product.images?.[0] ||
            product.customization?.layers?.[0]?.image ||
            null,
        };

    orderItems.push({
      productId: product._id,
      variantId: variant._id,
      productName: product.name,
      variantLabel: variant.value,
      sellingPrice: price,
      qty,
      gstPercent: product.gstPercent || 0,
      layer,
      _product: product,
      _variant: variant,
    });
  }

  let coupon = null;

  if (couponCode) {
    const couponQuery = Coupon.findOne({
      code: couponCode.toUpperCase(),
      status: "ACTIVE",
    });

    if (session) couponQuery.session(session);

    coupon = await couponQuery;

    if (!coupon) {
      throw new Error("Invalid coupon");
    }

    const now = new Date();

    if (now < coupon.startDate || now > coupon.endDate) {
      throw new Error("Coupon expired");
    }

    if (totalAmount < coupon.minOrderAmount) {
      throw new Error("Minimum order amount not reached");
    }

    const usageQuery = CouponUsage.findOne({
      coupon: coupon._id,
      user: customerId,
    });

    if (session) usageQuery.session(session);

    const alreadyUsed = await usageQuery;

    if (alreadyUsed) {
      throw new Error("You already used this coupon");
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error("Coupon usage limit reached");
    }

    if (coupon.type === "PERCENT") {
      discountAmount = (totalAmount * coupon.value) / 100;

      if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.value;
    }

    discountAmount = Math.min(discountAmount, totalAmount);
    discountAmount = Number(discountAmount.toFixed(2));
  }

  const payableAmount = Number(
    (totalAmount + gstAmount - discountAmount).toFixed(2)
  );

  return {
    cart,
    orderItems,
    coupon,
    totalAmount: Number(totalAmount.toFixed(2)),
    gstAmount: Number(gstAmount.toFixed(2)),
    discountAmount,
    payableAmount,
  };
}

async function decrementStock(orderItems, session) {
  for (const item of orderItems) {
    const product = item._product;
    const variant = item._variant;

    const stockUpdate = await Product.updateOne(
      {
        _id: product._id,
        "variants._id": variant._id,
        "variants.stockQty": { $gte: item.qty },
      },
      { $inc: { "variants.$.stockQty": -item.qty } },
      { session }
    );

    if (stockUpdate.modifiedCount === 0) {
      throw new Error(`Stock update failed for ${product.name}`);
    }
  }
}

function stripInternalOrderItems(orderItems) {
  return orderItems.map(
    ({ _product, _variant, productId, variantId, ...rest }) => rest
  );
}

export async function fulfillPaidOrder({
  customerId,
  user,
  orderItems,
  coupon,
  totals,
  paymentRecord,
  deliveryAddress,
  deliveryDate,
  notes,
  transactionId,
  session,
}) {
  await decrementStock(orderItems, session);

  let isNewAddress = true;

  const existingAddress = user.addresses?.find(
    (addr) =>
      addr.fullAddress === deliveryAddress.fullAddress &&
      addr.mobile === deliveryAddress.mobile &&
      addr.city === deliveryAddress.city &&
      addr.state === deliveryAddress.state &&
      addr.pincode === deliveryAddress.pincode &&
      addr.type === deliveryAddress.type
  );

  if (existingAddress) isNewAddress = false;

  if (isNewAddress) {
    await Customer.updateOne(
      { _id: customerId },
      {
        $push: {
          addresses: {
            ...deliveryAddress,
            location: {
              type: "Point",
              coordinates: [
                deliveryAddress.longitude,
                deliveryAddress.latitude,
              ],
            },
          },
        },
      },
      { session }
    );
  }

  const nearestStore = await StoreModel.findOne({
    "address.location": {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [
            deliveryAddress.longitude,
            deliveryAddress.latitude,
          ],
        },
        $maxDistance: 20000000,
      },
    },
  });

  const mrOrderId = await generateMRId("ORD", "ORDER");

  const orderArr = await Order.create(
    [
      {
        mrOrderId,
        customerId,
        store: nearestStore?._id,
        items: stripInternalOrderItems(orderItems),
        totalAmount: totals.totalAmount,
        gstAmount: totals.gstAmount,
        discountAmount: totals.discountAmount,
        payableAmount: totals.payableAmount,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        paymentModuleId: paymentRecord?.mrPaymentId || paymentRecord?._id,
        transactionId,
        deliveryAddress: {
          ...deliveryAddress,
          location: {
            type: "Point",
            coordinates: [
              deliveryAddress.longitude,
              deliveryAddress.latitude,
            ],
          },
        },
        notes,
        deliveryDate,
        status: ORDER_STATUS.PLACED,
      },
    ],
    { session }
  );

  const order = orderArr[0];

  paymentRecord.order = order._id;
  paymentRecord.status = PAYMENT_STATUS.COMPLETED;
  paymentRecord.completedAt = new Date();
  await paymentRecord.save({ session });

  if (coupon) {
    await CouponUsage.create(
      [{ coupon: coupon._id, user: customerId }],
      { session }
    );

    await Coupon.updateOne(
      { _id: coupon._id },
      { $inc: { usedCount: 1 } },
      { session }
    );
  }

  await Cart.updateOne(
    { customerId },
    { $set: { items: [] } },
    { session }
  );

  const updatedUser = await Customer.findById(customerId).session(session);

  return { order, updatedUser };
}

export async function createInitiatedPaymentRecord({
  gatewayName,
  payableAmount,
  gatewayOrderId,
  user,
  checkoutSessionId,
  session,
}) {
  const mrPaymentId = await generateMRId("PAY", "PAYMENT");

  const paymentArr = await Payment.create(
    [
      {
        amount: payableAmount,
        method: gatewayName.toUpperCase(),
        gatewayName,
        mrPaymentId,
        gatewayOrderId,
        status: PAYMENT_STATUS.INITIATED,
        checkoutSessionId,
        customer: {
          name: user?.fullName || user?.name,
          email: user?.email,
          phone: user?.mobile,
        },
      },
    ],
    { session }
  );

  return paymentArr[0];
}

export async function findCompletedPayment({
  transactionId,
  gatewayOrderId,
}) {
  const query = {
    status: { $in: [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.COMPLETED] },
    order: { $exists: true, $ne: null },
  };

  if (transactionId) {
    return Payment.findOne({ ...query, transactionId });
  }

  if (gatewayOrderId) {
    return Payment.findOne({ ...query, gatewayOrderId });
  }

  return null;
}

export async function markCheckoutSessionStatus(sessionId, status) {
  if (!sessionId) return;

  await PaymentCheckoutSession.updateOne(
    { sessionId },
    { $set: { status } }
  );
}

export async function markCheckoutSessionProcessing(session) {
  if (!session || session.status === CHECKOUT_SESSION_STATUS.COMPLETED) {
    return;
  }

  session.status = CHECKOUT_SESSION_STATUS.PROCESSING;
  await session.save();
}
