




import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { generateToken } from "../utils/jwt.js";
import { registerUserSchema } from "../validators/auth.validator.js";
import { hashPassword } from "../utils/passwordUtils.js";



// Register user (SUPER_ADMIN only)
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, mobile, password, roles: requestedRoles } = req.body;

    const { error } = registerUserSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const callerRoles = req.user?.roles || [];
    const userCount = await User.countDocuments();
    let roles = Array.isArray(requestedRoles) ? [...requestedRoles] : ["CUSTOMER"];

    if (userCount === 0) {
      roles = ["SUPER_ADMIN"];
    } else if (roles.includes("SUPER_ADMIN") && !callerRoles.includes("SUPER_ADMIN")) {
      return res.status(403).json({
        success: false,
        message: "Only SUPER_ADMIN can assign SUPER_ADMIN role",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      fullName,
      email,
      mobile,
      roles,
      passwordHash: hashedPassword
    });

    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


/* --------------------------------------------------
 🔐 LOGIN API
-------------------------------------------------- */
// export const loginUser = async (req, res) => {
//   try {
//     const { mobile, password } = req.body;

//     /* --------------------
//        Validation
//     -------------------- */
//     if (!mobile || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile and password are required"
//       });
//     }

//     /* --------------------
//        Find user
//     -------------------- */
//     const user = await User.findOne({ mobile })
//       .select("+passwordHash +refreshToken")
//       .populate("roles", "name")
//       .lean(false); // need save()

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid credentials"
//       });
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({
//         success: false,
//         message: "Your account is blocked"
//       });
//     }

//     /* --------------------
//        Password check
//     -------------------- */
//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid credentials"
//       });
//     }

//     /* --------------------
//        Generate tokens
//     -------------------- */
//     const roleNames = user.roles.map(r => r.name);

// const tokens = generateToken({
//   userId: user._id,
//   roles: roleNames
// });


//     user.refreshToken = tokens.refreshToken;
//     user.lastLoginAt = new Date();
//     await user.save();

//     /* --------------------
//        Response
//     -------------------- */
//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       user:user,
//       tokens
//     });

//   } catch (error) {
//     console.error("LOGIN ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong"
//     });
//   }
// };


// Refresh token

// export const loginUser = async (req, res) => {
//   try {
//     const { mobile, password } = req.body

//     if (!mobile || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Mobile and password are required",
//       })
//     }

//     const user = await User.findOne({ mobile })
//       .select("+passwordHash +refreshToken")
//       .populate("roles", "name")

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid mobile or password",
//       })
//     }

//     if (user.isBlocked) {
//       return res.status(403).json({
//         success: false,
//         message: "Your account is blocked",
//       })
//     }

//     const isMatch = await bcrypt.compare(password, user.passwordHash)
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid mobile or password",
//       })
//     }

    

//     const roleNames = user.roles.map(r => r.name)

//     const tokens = generateToken({
//       userId: user._id,
//       roles: roleNames,
//     })

//     user.refreshToken = tokens.refreshToken
//     user.lastLoginAt = new Date()
//     await user.save()


//         /* --------------------
//        Fetch permissions
//     -------------------- */
//     let permissions = [];

//     // 🔥 SUPER ADMIN → all access
//     if (roleNames.includes(USER_ROLE.SUPER_ADMIN)) {
//       const modules = await ModuleModel.find({ isActive: true }).lean();

//       permissions = modules.map(m => ({
//         moduleKey: m.moduleKey,
//         permissions: {
//           read: true,
//           create: true,
//           update: true,
//           delete: true
//         }
//       }));
//     } else {
//       permissions = await ModulePermissionModel.find({
//         role: { $in: roleNames }
//       }).lean();
//     }

//     console.log("permdions",permissions)

//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       user: {
//         _id: user._id,
//         fullName: user.fullName,
//         mobile: user.mobile,
//         email: user.email,
//         roles: roleNames,
//         mrId: user.mrId,
//       },
//       accessToken: tokens.accessToken,
//       permissions:permissions
//     })

//   } catch (err) {
//     console.error("LOGIN ERROR:", err)
//     return res.status(500).json({
//       success: false,
//       message: "Server error. Please try again",
//     })
//   }
// }


export const loginUser = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    console.log("mobile",mobile)

    if (!mobile || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile and password are required",
      });
    }

    // ✅ Get user with passwordHash + refreshToken
    const user = await User.findOne({ mobile })
      .select("+passwordHash +refreshToken")
      .populate("roles", "role"); // roles populate

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile or password",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked",
      });
    }

    // ✅ Check password securely
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile or password",
      });
    }

    // ✅ Get roles and check if SUPER_ADMIN
    const roleNames = user.roles.map(r => r.role);
    const isSuperAdmin = roleNames.includes("SUPER_ADMIN");

  

    // ✅ Generate tokens
    const tokens = generateToken({
      userId: user._id,
      roles: roleNames,
      isSuperAdmin,
    });



    // ✅ Update refreshToken and lastLoginAt in DB
    user.refreshToken = tokens.refreshToken;
    user.lastLoginAt = new Date();
    await user.save(); // mongoose document -> safe

    // ✅ Response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        fullName: user.fullName,
        dp: user.dp?.url || null,
        mobile: user.mobile,
        email: user.email,
        roles: roleNames,
        isSuperAdmin,
        mrId: user.mrId,
      },
      accessToken: tokens.accessToken,
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again",
    });
  }
};




export const getSidebar = async (req, res) => {
  try {
    const { userId, roles, isSuperAdmin } = req.user;

    const modules = await Module.find({ isActive: true }).lean();

    // 🔥 SUPER ADMIN → ALL
    if (isSuperAdmin) {
      return res.json({
        success: true,
        sidebar: modules.map(m => ({
          name: m.displayName,
          slug: "/" + m.displayName.toLowerCase().replace(/\s+/g, "-"),
          moduleKey: m.moduleKey,
        })),
      });
    }

    // 1️⃣ User permissions
    const userPerms = await UserPermission.find({
      userId,
      "permissions.read": true,
    }).lean();

    const userPermMap = {};
    userPerms.forEach(p => {
      userPermMap[p.moduleKey] = true;
    });

    // 2️⃣ Role permissions
    const rolePerms = await ModulePermission.find({
      role: { $in: roles },
      "permissions.read": true,
    }).lean();

    const rolePermSet = new Set(rolePerms.map(p => p.moduleKey));

    // 3️⃣ Filter modules
    const sidebar = modules.filter(m => {
      if (userPermMap[m.moduleKey] !== undefined) {
        return userPermMap[m.moduleKey];
      }
      return rolePermSet.has(m.moduleKey);
    });

    return res.json({
      success: true,
      sidebar: sidebar.map(m => ({
        name: m.displayName,
        slug: "/" + m.displayName.toLowerCase().replace(/\s+/g, "-"),
        moduleKey: m.moduleKey,
      })),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};


export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId).populate("roles", "role");
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const roleNames = user.roles.map((r) => r.role);
    const tokens = generateToken({
      userId: user._id,
      roles: roleNames,
      isSuperAdmin: roleNames.includes("SUPER_ADMIN"),
    });
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({ success: true, tokens });
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Logout
export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.refreshToken = null;
    await user.save();
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
