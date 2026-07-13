import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const COLLECTION_RENAMES = [
  { collection: "users", from: "rmId", to: "mrId" },
  { collection: "orders", from: "rmOrderId", to: "mrOrderId" },
  { collection: "products", from: "rmProductId", to: "mrProductId" },
  { collection: "stores", from: "rmStoreId", to: "mrStoreId" },
  { collection: "customers", from: "rmCustomerId", to: "mrCustomerId" },
  { collection: "roles", from: "rmRoleId", to: "mrRoleId" },
  { collection: "modules", from: "rmModuleId", to: "mrModuleId" },
  { collection: "modulepermissions", from: "rmModulePrms", to: "mrModulePrms" },
  { collection: "storestaffs", from: "rmStaffId", to: "mrStaffId" },
  { collection: "commissionconfigs", from: "rmCommissionConfigId", to: "mrCommissionConfigId" },
  { collection: "payments", from: "rmPaymentId", to: "mrPaymentId" },
  { collection: "banners", from: "rmNo", to: "mrNo" },
  { collection: "enquiries", from: "rmEnquiryId", to: "mrEnquiryId" },
  { collection: "coupons", from: "rmCouponId", to: "mrCouponId" },
  { collection: "categories", from: "rmCategoryId", to: "mrCategoryId" },
  { collection: "faqs", from: "rmFaqId", to: "mrFaqId" },
  { collection: "testimonials", from: "rmTestimonialId", to: "mrTestimonialId" },
  { collection: "blogs", from: "rmBlogId", to: "mrBlogId" },
  { collection: "jobs", from: "rmJobId", to: "mrJobId" },
  { collection: "jobapplications", from: "rmAppliedJobId", to: "mrAppliedJobId" },
  { collection: "otps", from: "rmOtpId", to: "mrOtpId" },
];

const CMS_SECTIONS = ["returnPolicy", "privacyPolicy", "termsCondition"];

const renameField = async (db, collection, from, to) => {
  const result = await db.collection(collection).updateMany(
    { [from]: { $exists: true } },
    { $rename: { [from]: to } }
  );
  if (result.modifiedCount > 0) {
    console.log(`✅ ${collection}: renamed ${from} → ${to} (${result.modifiedCount} docs)`);
  }
};

const migrateCmsContentIds = async (db) => {
  const cmsDocs = await db.collection("cms").find({}).toArray();

  for (const doc of cmsDocs) {
    let changed = false;
    const update = {};

    for (const section of CMS_SECTIONS) {
      const contents = doc?.[section]?.contents;
      if (!Array.isArray(contents)) continue;

      let sectionChanged = false;
      const updatedContents = contents.map((item) => {
        if (item?.rmContentId && !item?.mrContentId) {
          sectionChanged = true;
          const { rmContentId, ...rest } = item;
          return { ...rest, mrContentId: rmContentId };
        }
        return item;
      });

      if (sectionChanged) {
        changed = true;
        update[`${section}.contents`] = updatedContents;
      }
    }

    if (changed) {
      await db.collection("cms").updateOne({ _id: doc._id }, { $set: update });
      console.log(`✅ cms: migrated nested rmContentId → mrContentId for ${doc._id}`);
    }
  }
};

const runMigration = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;

  console.log("🔄 Starting rm → mr field migration...");

  for (const { collection, from, to } of COLLECTION_RENAMES) {
    try {
      await renameField(db, collection, from, to);
    } catch (err) {
      console.warn(`⚠️  Skipped ${collection}: ${err.message}`);
    }
  }

  try {
    await migrateCmsContentIds(db);
  } catch (err) {
    console.warn(`⚠️  CMS migration skipped: ${err.message}`);
  }

  console.log("🎉 Migration complete");
  await mongoose.disconnect();
  process.exit(0);
};

runMigration().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
