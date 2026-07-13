// export const generateMRId = (prefix) => {
//   const random = Math.floor(10000000 + Math.random() * 90000000);
//   return `${prefix}-${random}`;
// };



// utils/mrId.js
import Counter from "../models/Counter.model.js";

export const generateMRId = async (prefix, sequenceName = "DEFAULT") => {
  const counter = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(6, "0"); // 6 digit
  return `${prefix}${paddedSeq}`;
};

export const generateTransactionId = () => {
  const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
  return `MR${randomNumber}`;
}



// 🔥 slug cleaner
const getSlug = (title = "") => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// 🔥 FINAL UNIQUE SLUG GENERATOR
export const generateProductSlug = async (name) => {
  // base slug
  const baseSlug = getSlug(name);

  // separate counter (NO mrId connection)
  const counter = await Counter.findByIdAndUpdate(
    "PRODUCT_SLUG",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const suffix = counter.seq; // 1,2,3...

  // first item clean, next with suffix
  const slug = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;

  return slug;
};


export const generateLayerId = () => {
  try {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  } catch (e) {
    // fallback if crypto is not available
    return (
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 6)
    ).slice(0, 12);
  }
};

// const getNextSequence = async (name) => {
//   const counter = await Counter.findByIdAndUpdate(
//     name,
//     { $inc: { seq: 1 } },
//     { new: true, upsert: true, setDefaultsOnInsert: true }
//   );
//   return counter.seq;
// };
