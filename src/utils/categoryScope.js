import mongoose from "mongoose";
import CategoryModel from "../models/Category.model.js";

const toValidIdStrings = (categoryIds = []) =>
  (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id) => String(id));

/**
 * Load adjacency maps once for recursive scope work.
 */
const loadCategoryMaps = async () => {
  const allCategories = await CategoryModel.find({})
    .select("_id parentCategory")
    .lean();

  const childrenMap = new Map();
  const parentMap = new Map();

  for (const cat of allCategories) {
    const id = String(cat._id);
    if (!cat.parentCategory) {
      parentMap.set(id, null);
      continue;
    }
    const parentId = String(cat.parentCategory);
    parentMap.set(id, parentId);
    if (!childrenMap.has(parentId)) childrenMap.set(parentId, []);
    childrenMap.get(parentId).push(id);
  }

  return { childrenMap, parentMap };
};

const collectDescendantsFromMap = (rootIds, childrenMap) => {
  const descendants = new Set();
  const stack = [...rootIds];

  while (stack.length) {
    const current = stack.pop();
    const kids = childrenMap.get(current) || [];
    for (const kid of kids) {
      if (descendants.has(kid)) continue;
      descendants.add(kid);
      stack.push(kid);
    }
  }

  return descendants;
};

const isAncestorOf = (maybeAncestor, nodeId, parentMap) => {
  let current = parentMap.get(String(nodeId));
  const guard = new Set();

  while (current) {
    if (guard.has(current)) break;
    guard.add(current);
    if (current === String(maybeAncestor)) return true;
    current = parentMap.get(current);
  }

  return false;
};

/**
 * Drop ancestor IDs when a more specific descendant is also selected.
 * Keeps sibling multi-select; never keeps parents of other selected nodes.
 */
export const pruneAncestorCategoryIds = (categoryIds = [], parentMap) => {
  const selected = [...new Set(toValidIdStrings(categoryIds))];
  if (selected.length <= 1) return selected;

  return selected.filter((id) => {
    for (const other of selected) {
      if (other === id) continue;
      // Drop this id if it is an ancestor of another selected id
      if (isAncestorOf(id, other, parentMap)) return false;
    }
    return true;
  });
};

/**
 * Collect all descendant category IDs under one or more roots (unlimited depth).
 * Does not include the root IDs themselves.
 */
export const collectDescendantCategoryIds = async (rootIds = []) => {
  const roots = toValidIdStrings(rootIds);
  if (!roots.length) return [];

  const { childrenMap } = await loadCategoryMaps();
  return [...collectDescendantsFromMap(roots, childrenMap)];
};

/**
 * Expand category IDs to include each selected ID + its own nested descendants only.
 * Ancestors / siblings of the selection are never included.
 * If both a parent and a descendant are sent, ancestors are pruned first.
 */
export const expandCategoryIdsWithDescendants = async (categoryIds = []) => {
  const rawRoots = toValidIdStrings(categoryIds);
  if (!rawRoots.length) return [];

  const { childrenMap, parentMap } = await loadCategoryMaps();
  const roots = pruneAncestorCategoryIds(rawRoots, parentMap);

  if (!roots.length) return [];

  const descendants = collectDescendantsFromMap(roots, childrenMap);
  const unique = new Set([...roots, ...descendants]);

  return [...unique].map((id) => new mongoose.Types.ObjectId(id));
};

/**
 * Mongo filter: product.category OR product.subCategory in expanded ID set.
 * Scope is selected node(s) + downward descendants only.
 */
export const buildProductCategoryMatchFilter = async (categoryIds = []) => {
  const ids = await expandCategoryIdsWithDescendants(categoryIds);
  if (!ids.length) {
    return { _id: { $exists: false } };
  }

  return {
    $or: [{ category: { $in: ids } }, { subCategory: { $in: ids } }],
  };
};
