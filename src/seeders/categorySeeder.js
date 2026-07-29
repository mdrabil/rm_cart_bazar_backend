import CategoryModel from "../models/Category.model.js";
import { CATEGORY_STATUS } from "../constants/enums.js";
import { generateMRId } from "../utils/mrId.js";

/**
 * Clothing / general merchandise placeholder hierarchy.
 * Idempotent: skips nodes that already exist under the same parent.
 */
const CATEGORY_TREE = [
  {
    name: "Clothing",
    children: [
      {
        name: "Men",
        children: [
          { name: "T-Shirts" },
          { name: "Shirts" },
          { name: "Jeans" },
          { name: "Hoodies" },
          { name: "Jackets" },
        ],
      },
      {
        name: "Women",
        children: [
          { name: "Kurtis" },
          { name: "Sarees" },
          { name: "Dresses" },
          { name: "Tops" },
          { name: "Leggings" },
        ],
      },
      {
        name: "Kids",
        children: [{ name: "Boys Wear" }, { name: "Girls Wear" }],
      },
      {
        name: "Footwear",
        children: [{ name: "Shoes" }, { name: "Sandals" }, { name: "Slippers" }],
      },
      {
        name: "Bags",
        children: [
          { name: "Backpacks" },
          { name: "Handbags" },
          { name: "Travel Bags" },
        ],
      },
      {
        name: "Accessories",
        children: [
          { name: "Caps" },
          { name: "Wallets" },
          { name: "Belts" },
          { name: "Sunglasses" },
          { name: "Watches" },
        ],
      },
    ],
  },
];

async function ensureCategory(name, parentCategory = null, createdBy = null) {
  const existing = await CategoryModel.findOne({
    name,
    parentCategory: parentCategory || null,
  });

  if (existing) return existing;

  const mrCategoryId = await generateMRId("CAT", "CATEGORY");
  return CategoryModel.create({
    mrCategoryId,
    name,
    parentCategory: parentCategory || null,
    status: CATEGORY_STATUS.ACTIVE,
    isActive: true,
    createdBy: createdBy || undefined,
  });
}

async function seedNode(node, parentId = null, createdBy = null) {
  const doc = await ensureCategory(node.name, parentId, createdBy);
  for (const child of node.children || []) {
    await seedNode(child, doc._id, createdBy);
  }
  return doc;
}

export const seedClothingCategories = async (createdBy = null) => {
  console.log("🌱 Seeding clothing category placeholders...");

  for (const root of CATEGORY_TREE) {
    await seedNode(root, null, createdBy);
  }

  console.log("✅ Clothing category placeholders ready");
};
