/**
 * One-time migration: Product.subCategory → Product.category (leaf).
 *
 * Legacy 2-level products stored parent in `category` and leaf in `subCategory`.
 * Unlimited nesting now uses Category.parentCategory; Product stores only the leaf in `category`.
 *
 * Safe to re-run (idempotent): only touches docs that still have subCategory set.
 *
 * Usage:
 *   node src/seeders/migrateProductSubCategory.js
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.model.js";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ DB connected");

  const withSub = await Product.countDocuments({
    subCategory: { $exists: true, $ne: null },
  });
  console.log(`Found ${withSub} products with legacy subCategory`);

  if (withSub > 0) {
    // Promote leaf (subCategory) → category, then drop subCategory
    const result = await Product.updateMany(
      { subCategory: { $exists: true, $ne: null } },
      [
        { $set: { category: "$subCategory" } },
        { $unset: "subCategory" },
      ]
    );
    console.log(
      `✅ Migrated: matched=${result.matchedCount}, modified=${result.modifiedCount}`
    );
  }

  // Clear any empty/null leftovers
  const cleared = await Product.updateMany(
    { $or: [{ subCategory: null }, { subCategory: "" }] },
    { $unset: { subCategory: "" } }
  );
  console.log(`✅ Cleared null/empty subCategory: modified=${cleared.modifiedCount}`);

  console.log("🌱 Migration done");
  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
