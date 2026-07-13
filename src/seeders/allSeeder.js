
import { MODULE_KEY } from "../constants/enums.js";
import ModuleModel from "../models/Module.model.js";

export const seedCouponModule = async (superAdminId) => {
  const exists = await ModuleModel.findOne({ moduleKey: MODULE_KEY.COUPON });
  if (exists) return;

  await ModuleModel.create({
    moduleKey: MODULE_KEY.COUPON,
    displayName: "Coupon Management",
    description: "Create and manage discount coupons",
    createdBy: superAdminId
  });

  console.log("✅ COUPON module seeded");
};
