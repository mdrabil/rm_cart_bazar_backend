import Coupon from "../models/Coupon.model.js";
import CouponUsage from "../models/CouponUsage.model.js";

/**
 * Atomically increment coupon usage and record per-user usage within a transaction.
 * Mirrors the guard used in COD place-order to prevent race overshoot of usageLimit.
 */
export async function applyCouponAtomically(coupon, customerId, session) {
  if (!coupon?._id) {
    throw new Error("Invalid coupon");
  }

  const updatedCoupon = await Coupon.findOneAndUpdate(
    {
      _id: coupon._id,
      $or: [
        { usageLimit: { $exists: false } },
        { usageLimit: null },
        { usedCount: { $lt: coupon.usageLimit } },
      ],
    },
    { $inc: { usedCount: 1 } },
    { new: true, session }
  );

  if (!updatedCoupon) {
    throw new Error("Coupon usage limit reached");
  }

  await CouponUsage.create(
    [{ coupon: coupon._id, user: customerId }],
    { session }
  );

  return updatedCoupon;
}
