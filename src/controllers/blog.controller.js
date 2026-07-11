import Blog from "../models/Blog.model.js";
import UserModel from "../models/User.model.js";
import asyncHandler from "express-async-handler";
import cloudinary from "../config/cloudinaryConfig.js";
import mongoose from "mongoose";
import { generateMRId } from "../utils/mrId.js";
import BlogCommentsModel from "../models/BlogComments.model.js";

// ================= CREATE BLOG =================
export const createBlog = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: "User not logged in" });

  const userId = req.user._id;
  const author = await UserModel.findById(userId);
  if (!author) return res.status(400).json({ success: false, message: "Author not found" });

  const { title, description, categories, tags, seoTitle, seoDescription, status,slug } = req.body;

  let finalSlug = slug;
  if (!finalSlug) {
    finalSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-");    // replace space with -
  }

  if (!title || !description || !categories?.length || !tags?.length || !req.files?.image || !req.files?.thumbnail) {
    return res.status(400).json({ success: false, message: "All fields including images are required" });
  }


  // Upload images
  const imgRes = await cloudinary.uploader.upload(req.files.image[0].path, { folder: "blogs" });
  const thumbRes = await cloudinary.uploader.upload(req.files.thumbnail[0].path, { folder: "blogs/thumbnails" });

  const mrBlogId = await generateMRId('BLG',"BLOG")

 const parsedCategories = Array.isArray(categories)
  ? categories
  : JSON.parse(categories || "[]");

const parsedTags = Array.isArray(tags)
  ? tags
  : JSON.parse(tags || "[]");

const blog = await Blog.create({
  title,
  mrBlogId,
    slug: finalSlug,
  description,
  categories: parsedCategories, // <-- store as array
  author: userId,
  tags: parsedTags,             // <-- store as array
  seoTitle,
  seoDescription,
  status: status || "draft",
  isPublished: status === "published",
  image: { public_id: imgRes.public_id, url: imgRes.secure_url },
  thumbnail: { public_id: thumbRes.public_id, url: thumbRes.secure_url },
});

  res.status(201).json({ success: true, data: blog });
});

export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

  const { title, description, categories, tags, seoTitle, seoDescription, status,slug } = req.body;

  // Replace images if uploaded
  if (req.files?.image) {
    await cloudinary.uploader.destroy(blog.image.public_id);
    const imgRes = await cloudinary.uploader.upload(req.files.image[0].path, { folder: "blogs" });
    blog.image = { public_id: imgRes.public_id, url: imgRes.secure_url };
  }
  if (req.files?.thumbnail) {
    await cloudinary.uploader.destroy(blog.thumbnail.public_id);
    const thumbRes = await cloudinary.uploader.upload(req.files.thumbnail[0].path, { folder: "blogs/thumbnails" });
    blog.thumbnail = { public_id: thumbRes.public_id, url: thumbRes.secure_url };
  }

  blog.title = title || blog.title;
  blog.slug = slug || blog.slug;
  blog.description = description || blog.description;
blog.categories = categories?.length
  ? Array.isArray(categories) ? categories : JSON.parse(categories)
  : blog.categories;

blog.tags = tags?.length
  ? Array.isArray(tags) ? tags : JSON.parse(tags)
  : blog.tags;
  blog.seoTitle = seoTitle || blog.seoTitle;
  blog.seoDescription = seoDescription || blog.seoDescription;
  if (status) {
    blog.status = status;
    blog.isPublished = status === "published";
  }

  await blog.save();
  res.json({ success: true, data: blog });
});

// ================= GET ALL BLOGS =================


export const getBlogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    author,
    category,
    tags,
    search,
    status,
  } = req.query;

  const query = {};

  // Author filter
  if (author && mongoose.Types.ObjectId.isValid(author)) {
    query.author = author;
  }

  // Tags filter
  if (tags) {
    const tagsArray = tags.split(",").map((t) => t.trim());
    query.tags = { $in: tagsArray };
  }

  // Category filter
  if (category) {
    const categoryArray = category.split(",").map((t) => t.trim());
    query.categories = { $in: categoryArray };
  }

  // Status filter
  if (status) {
    query.status = status;
  }

  // Search
  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // 1️⃣ Get blogs
  const blogs = await Blog.find(query)
    .populate("author", "fullName email mobile")  .populate({
    path: "comments",
    options: { sort: { createdAt: -1 } },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // 2️⃣ Get comment count per blog (fast way)
  const blogIds = blogs.map((b) => b._id);

  const commentCounts = await BlogCommentsModel.aggregate([
    { $match: { blogId: { $in: blogIds } } },
    {
      $group: {
        _id: "$blogId",
        count: { $sum: 1 },
      },
    },
  ]);

  // Convert to map
  const commentCountMap = {};
  commentCounts.forEach((item) => {
    commentCountMap[item._id.toString()] = item.count;
  });

  // 3️⃣ Attach commentCount to blogs
  const updatedBlogs = blogs.map((blog) => ({
    ...blog,
    commentCount: commentCountMap[blog._id.toString()] || 0,
  }));

  const total = await Blog.countDocuments(query);

  res.json({
    success: true,
    total,
    page: pageNum,
    limit: limitNum,
    data: updatedBlogs,
  });
});


// ================= GET BLOG BY ID =================

export const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid blog ID",
    });
  }

  // 1️⃣ Get blog with author
  const blog = await Blog.findById(id)
    .populate("author", "name email")
    .lean();

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  // 2️⃣ Get all comments of this blog
  const comments = await BlogCommentsModel.find({ blogId: id })
    .sort({ createdAt: 1 }) // oldest first
    .lean();

  // 3️⃣ Create nested structure
  const commentMap = {};
  const rootComments = [];

  // First pass: add replies array
  comments.forEach((comment) => {
    comment.replies = [];
    commentMap[comment._id.toString()] = comment;
  });

  // Second pass: assign replies
  comments.forEach((comment) => {
    if (comment.parent) {
      const parentId = comment.parent.toString();
      if (commentMap[parentId]) {
        commentMap[parentId].replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  blog.comments = rootComments;

  res.json({
    success: true,
    data: blog,
  });
});


export const getBlogBySlug = asyncHandler(async (req, res) => {
 console.log("get data",req.params) 

  const blog = await Blog.findOne({ slug: req.params.slug })


    .populate("author", "fullName email")
    .lean();

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  const comments = await BlogCommentsModel.find({ blogId: blog._id })
    .sort({ createdAt: 1 })
    .lean();

  const commentMap = {};
  const rootComments = [];

  comments.forEach((comment) => {
    comment.replies = [];
    commentMap[comment._id.toString()] = comment;
  });

  comments.forEach((comment) => {
    if (comment.parent) {
      const parentId = comment.parent.toString();
      if (commentMap[parentId]) {
        commentMap[parentId].replies.push(comment);
      }
    } else {
      rootComments.push(comment);
    }
  });

  blog.comments = rootComments;

  res.json({
    success: true,
    data: blog,
  });
});

// ================= UPDATE BLOG =================


// ================= DELETE BLOG =================
export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

  await cloudinary.uploader.destroy(blog.image.public_id);
  await cloudinary.uploader.destroy(blog.thumbnail.public_id);
  await blog.remove();

  res.json({ success: true, message: "Blog deleted successfully" });
});

// ================= ADD COMMENT / REPLY =================

export const addComment = asyncHandler(async (req, res) => {
  const { blogId, message, parent, userName, email } = req.body;

  if (!blogId || !message?.trim()) {
    return res.status(400).json({
      success: false,
      message: "BlogId and message are required",
    });
  }

  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  let finalUserName = null;
  let finalEmail = null;

  if (parent) {
    const parentComment = await BlogCommentsModel.findById(parent);
    if (!parentComment) {
      return res.status(404).json({
        success: false,
        message: "Parent comment not found",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Login required to reply",
      });
    }

    finalUserName = req.user.fullName;
    finalEmail = req.user.email;

  } 
  
  else {
    if (req.user) {

      console.log("get logged data",req.user)

      finalUserName = req.user.fullName;
      finalEmail = req.user.email;
    } else {
      if (!userName || !email) {
        return res.status(400).json({
          success: false,
          message: "Name and email are required for comment",
        });
      }

      finalUserName = userName.trim();
      finalEmail = email.trim();
    }
  }

  const newComment = await BlogCommentsModel.create({
    blogId,
    userName: finalUserName,
    userEmail: finalEmail,
    message: message.trim(),
    parent: parent || null,
  });

      blog.comments.push(newComment._id);
    await blog.save();



  res.status(201).json({
    success: true,
    message: parent ? "Reply added" : "Comment added",
    data: newComment,
  });
});
// ================= UPDATE STATUS ONLY =================
export const updateBlogStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !["draft", "published", "archived", "on_hold"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid status value",
    });
  }

  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return res.status(404).json({
      success: false,
      message: "Blog not found",
    });
  }

  // ✅ Only blog creator can update
  if (blog.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: "You are not allowed to update this blog",
    });
  }

  blog.status = status;
  blog.isPublished = status === "published";

  await blog.save();

  res.json({
    success: true,
    message: "Status updated successfully",
    data: {
      status: blog.status,
      isPublished: blog.isPublished,
    },
  });
});