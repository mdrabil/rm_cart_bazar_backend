import CmsPage from "../models/CmsPage.model.js";
import { createCmsSchema, updateCmsSchema } from "../validations/cms.validation.js";
import sanitizeHtml from "sanitize-html";

/* CREATE */
export const createCmsPage = async (req, res) => {
  try {
    const parsed = createCmsSchema.parse(req.body);

    if (typeof parsed.content === "string") {
      parsed.content = sanitizeHtml(parsed.content);
    }

    const page = await CmsPage.create({
      ...parsed,
      updatedBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: page });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* UPDATE */
export const updateCmsPage = async (req, res) => {
  try {
    const parsed = updateCmsSchema.parse(req.body);

    if (parsed.content && typeof parsed.content === "string") {
      parsed.content = sanitizeHtml(parsed.content);
    }

    const page = await CmsPage.findByIdAndUpdate(
      req.params.id,
      { ...parsed, updatedBy: req.user?._id },
      { new: true, runValidators: true }
    );

    if (!page) return res.status(404).json({ message: "Page not found" });

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* DELETE */
export const deleteCmsPage = async (req, res) => {
  const page = await CmsPage.findByIdAndDelete(req.params.id);

  if (!page) return res.status(404).json({ message: "Page not found" });

  res.json({ success: true, message: "Deleted successfully" });
};

/* ADMIN GET ALL (Pagination + Filter) */
export const getAllCmsPages = async (req, res) => {
  const { page = 1, limit = 10, status, type, search } = req.query;

  const query = {};

  if (status) query.status = status;
  if (type) query.type = type;
  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  const pages = await CmsPage.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .lean();

  const total = await CmsPage.countDocuments(query);

  res.json({
    success: true,
    data: pages,
    total,
    page: Number(page),
    pages: Math.ceil(total / limit),
  });
};

/* PUBLIC GET BY SLUG (Only Published) */
export const getCmsBySlug = async (req, res) => {
  const page = await CmsPage.findOne({
    slug: req.params.slug,
    status: "published",
  }).lean();

  if (!page) return res.status(404).json({ message: "Page not found" });

  res.json({ success: true, data: page });
};