// utils/storeAccess.helper.js
import StoreStaff from "../models/StoreStaff.model.js";
import Store from "../models/Store.model.js";
import { USER_ROLE } from "../constants/enums.js";

const BYPASS = [USER_ROLE.ADMIN,USER_ROLE.SUPER_ADMIN,USER_ROLE.GLOBAL_SUPPORT,USER_ROLE.SALES_ADMIN];





// 🔥 MAIN BUILDER (LOW LEVEL)
export const buildStoreFilter = async (user, options = {}) => {
  const { field = "store", storeId } = options;

  // ✅ FULL ACCESS
  if (user.roles.some(r => BYPASS.includes(r))) {
    return storeId ? { [field]: storeId } : {};
  }

  const conditions = [];

  // 🔹 STAFF
  const staffStoreIds = await StoreStaff
    .find({ user: user._id, isActive: true })
    .distinct("store");

  if (staffStoreIds.length) {
    conditions.push({ [field]: { $in: staffStoreIds } });
  }

  // 🔹 OWNER
  const ownerStoreIds = await Store
    .find({ owner: user._id })
    .distinct("_id");

  if (ownerStoreIds.length) {
    conditions.push({ [field]: { $in: ownerStoreIds } });
  }

  if (!conditions.length) {
    return { [field]: null };
  }

  const accessFilter = { $or: conditions };

  // 🔥 SPECIFIC STORE
  if (storeId) {
    return {
      $and: [
        accessFilter,
        { [field]: storeId }
      ]
    };
  }

  return accessFilter;
};





// 🔥 SINGLE STORE ROLE CHECK (ULTRA FAST)
export const getUserStoreRole = async (user, storeId) => {
  console.log("user Data",user)
  if (user.roles.some(r => BYPASS.includes(r))) return "FULL_ACCESS";

  // OWNER
  const isOwner = await Store.exists({ _id: storeId, owner: user._id });
  if (isOwner) return "OWNER";

  // STAFF
  const staff = await StoreStaff.findOne({
    store: storeId,
    user: user._id,
    isActive: true
  }).select("role");

  if (staff) return staff.role;

  return null;
};


