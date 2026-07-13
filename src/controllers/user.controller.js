import User from "../models/User.model.js";
import Joi from "joi";
import bcrypt from "bcryptjs";
import { USER_ROLE } from "../constants/enums.js";
import RoleModel from "../models/Role.model.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { sendEmail } from "../constants/mailer.js";

// 🔹 Joi validation schemas
const createUserSchema = Joi.object({
  fullName: Joi.string().required(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  email: Joi.string().email().required(),
  roles: Joi.array().items(Joi.string()).required(), // IDs sent from frontend
});


export const updateUserSchema = Joi.object({
  fullName: Joi.string(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/),
  email: Joi.string().email(),
  roles: Joi.array().items(Joi.string()),
  isBlocked: Joi.boolean(),
  password: Joi.string().optional(),
}).min(1);


   const generatePassword = () => {
      const numbers = Math.floor(10000 + Math.random() * 90000);
      return `RM${numbers}R`;
    };
// 🔹 Create User with role validation
export const createUser = async (req, res) => {
  try {
    // 1️⃣ Validate request body
    const { error, value } = createUserSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { fullName, mobile, email, roles: roleIds } = value;

    // 2️⃣ Check duplicate mobile/email
    const duplicate = await User.findOne({ $or: [{ mobile }, { email }] });
    if (duplicate) return res.status(400).json({ success: false, message: "Mobile or Email already exists" });

    // 3️⃣ Validate each role ID exists in Role collection
    const roles = await RoleModel.find({ _id: { $in: roleIds }, isActive: true });

    if (!roles || roles.length === 0) {
      return res.status(400).json({ success: false, message: "At least one valid role is required" });
    }

    if (roles.length !== roleIds.length) {
      return res.status(400).json({ success: false, message: "Some role IDs are invalid" });
    }

    // 4️⃣ Generate random password
    const plainPassword = generatePassword();

    // 5️⃣ Hash password
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // 6️⃣ Create user
    const user = await User.create({
      fullName,
      mobile,
      email,
      roles: roles.map(r => r._id), // only valid role IDs
      passwordHash,
    });

    // 7️⃣ Send email asynchronously
    setImmediate(() => {
      sendEmail(
        email,
        "Your Account Created",
        `Hello ${fullName},\n\nYour account has been created successfully.\n\nEmail: ${email}\nPassword: ${plainPassword}\n\nPlease change your password after first login.`
      );
    });

    res.status(201).json({ success: true, user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 🔹 Joi schema for updating user


// 🔹 Update user controller
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1️⃣ Validate body
    const { error, value } = updateUserSchema.validate(req.body);
    if (error)
      return res.status(400).json({ success: false, message: error.details[0].message });

    // 2️⃣ Password hashing if updating password
    if (value.password) {
      value.passwordHash = await bcrypt.hash(value.password, 10);
      delete value.password;
    }

    // 3️⃣ Duplicate mobile/email check
    if (value.mobile || value.email) {
      const duplicate = await User.findOne({
        _id: { $ne: userId },
        $or: [
          value.mobile ? { mobile: value.mobile } : null,
          value.email ? { email: value.email } : null,
        ].filter(Boolean),
      });
      if (duplicate)
        return res
          .status(400)
          .json({ success: false, message: "Mobile or Email already exists" });
    }

    // 4️⃣ Validate role IDs exist in Role collection
    if (value.roles) {
      const roles = await RoleModel.find({ _id: { $in: value.roles }, isActive: true });
      if (roles.length !== value.roles.length) {
        return res
          .status(400)
          .json({ success: false, message: "Some role IDs are invalid" });
      }
    }

    // 5️⃣ Update user
    const user = await User.findByIdAndUpdate(userId, value, { new: true })
      .select("-passwordHash -refreshToken")
      .populate({ path: "roles", select: "name" });

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    console.error("UPDATE USER ERROR:", err);
    res.status(500).json({ success: false, message: "Server error. Try again later." });
  }
};

// 🔹 Get User by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // SUPER_ADMIN can access all, others can only access self
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN) && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(userId).select("-passwordHash -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// 🔹 Get All Users (Paginated, Search, Exclude Admins)
export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    // 🔹 Get ADMIN & SUPER_ADMIN role IDs
    const adminRoles = await RoleModel.find({
      role: { $in: [USER_ROLE.SUPER_ADMIN] },
      isActive: true,
    }).select("_id");

    const adminRoleIds = adminRoles.map((r) => r._id);

    // 🔹 Filter: exclude admin users
    const filter = {
      roles: { $nin: adminRoleIds },
    };

    // 🔹 Search filter
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    // 🔹 Total count for pagination
    const total = await User.countDocuments(filter);

    // 🔹 Fetch users with roles populated
    const users = await User.find(filter)
      .select("-passwordHash -refreshToken")
      .populate({
        path: "roles",
        select: "role", // return only role name
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      users,
    });
  } catch (err) {
    console.error("GET ALL USERS ERROR:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error. Try again later." });
  }
};




export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // authMiddleware should set req.user

    console.log("get the userid",userId)
    console.log("get the user",req.body)
    const user = await User.findById(userId).select("+passwordHash +image");

    if (!user) return res.status(404).json({ message: "User not found" });

    const { fullName, mobile, email, oldPassword, password } = req.body;

    // ---------------- Update Basic Info ----------------
    if (fullName) user.fullName = fullName;
    if (mobile) user.mobile = mobile;
    if (email) user.email = email;

    // ---------------- Update Password ----------------
    if (oldPassword && password) {
      const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

      const hashedPassword = await bcrypt.hash(password, 10);
      user.passwordHash = hashedPassword;
    }

    // ---------------- Update Profile Image ----------------
    if (req.file) {
      // delete old image from cloudinary if exists
      if (user.dp && user.dp.public_id) {
        await cloudinary.uploader.destroy(user.dp.public_id);
      }

      // upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "user_dp",
        width: 300,
        height: 300,
        crop: "fill",
      });

      user.dp = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    await user.save();

    // return updated user (exclude passwordHash)
    const { passwordHash, ...userData } = user.toObject();

    res.json({ success: true, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Update failed" });
  }
};

// 🔹 Get All Users (SUPER_ADMIN only) with pagination + search
// export const getAllUsers = async (req, res) => {
//   try {
//     // Only SUPER_ADMIN can list users
//     const roleNames = req.user.roles.map(r => r.name);
//     if (!roleNames.includes(USER_ROLE.SUPER_ADMIN)) {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }

//     // Pagination + search params
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const search = req.query.search || "";

//     // Build filter
//     const filter = {};
//     if (search) {
//       // Search by name, email, or mobile
//       filter.$or = [
//         { fullName: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//         { mobile: { $regex: search, $options: "i" } },
//       ];
//     }

//     const total = await User.countDocuments(filter);

//     const users = await User.find(filter)
//       .select("-passwordHash -refreshToken")
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       total,
//       page,
//       limit,
//       users,
//     });
//   } catch (err) {
//     console.error("GET ALL USERS ERROR:", err);
//     res.status(500).json({ success: false, message: "Server error. Try again later." });
//   }
// };


// 🔹 Delete User (SUPER_ADMIN only)
export const deleteUser = async (req, res) => {
  try {
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// controllers/user.controller.js

export const toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Toggle the isBlocked status
    user.isBlocked = !user.isBlocked;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User has been ${user.isBlocked ? "blocked" : "unblocked"}`,
      user: {
        _id: user._id,
        fullName: user.fullName,
        isBlocked: user.isBlocked,
      },
    });

  } catch (err) {
    console.error("TOGGLE STATUS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not toggle status",
    });
  }
};