// controllers/storeStaff.controller.js
import mongoose from "mongoose";
import StoreStaff from "../models/StoreStaff.model.js";

import Store from "../models/Store.model.js";
import bcrypt from "bcryptjs";
import { createStaffSchema } from "../validations/storeStaff.validation.js";
import UserModel from "../models/User.model.js";
import { sendEmail } from "../constants/mailer.js";
import StoreStaffModel from "../models/StoreStaff.model.js";
import { buildStoreFilter, getUserStoreRole } from "../utils/accessHelper.js";
import { STAFF_USER_ROLE } from "../constants/enums.js";
import RoleModel from "../models/Role.model.js";





// ye done hai 
// export const createStoreStaff = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {


    
//     const { error } = createStaffSchema.validate(req.body);
//     if (error) {
//       return res.status(400).json({ success: false, message: error.message });
//     }
    
//     const { store, role, userOption, userId, newUser } = req.body;
  

//     session.startTransaction();

//     // ✅ Store check
//     const storeExists = await Store.findById(store).session(session);
//     if (!storeExists) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ success: false, message: "Store not found" });
//     }

//      const loggedUserRole = await getUserStoreRole(req.user, store);
    
//         if (!loggedUserRole) { 
//           return res.status(403).json({ message: "No access To Create User" });
//         }
    
       
//         if (![STAFF_USER_ROLE.STORE_MANAGER, STAFF_USER_ROLE.OWNER, "FULL_ACCESS"].includes(loggedUserRole)) {
//           return res.status(403).json({ message: "No access To Create User" });
//         }

//     let user;
//     let plainPassword = null;
//     let isNewUserCreated = false;

//     const generatePassword = () => {
//       const numbers = Math.floor(10000 + Math.random() * 90000);
//       return `RM${numbers}R`;
//     };


//     if (userOption === "new") {
//       const existingUser = await UserModel.findOne({
//         $or: [
//           { mobile: newUser.mobile },
//           ...(newUser.email ? [{ email: newUser.email }] : []),
//         ],
//       }).session(session);

//       if (existingUser) {
//         await session.abortTransaction();
//         session.endSession();

//         return res.status(400).json({
//           success: false,
//           message: "Email or Mobile already registered",
//         });
//       }

//       plainPassword = generatePassword();
//       const hash = await bcrypt.hash(plainPassword, 8);

//       // 🔥 DEFAULT USER ROLE
//       const defaultRole = await Role.findOne({ role: "USER" }).session(session);

//       if (!defaultRole) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(500).json({
//           success: false,
//           message: "Default USER role not found",
//         });
//       }

//       const createdUser = await UserModel.create(
//         [
//           {
//             fullName: newUser.fullName,
//             mobile: newUser.mobile,
//             email: newUser.email,
//             passwordHash: hash,
//             roles: [defaultRole._id], // ✅ default role
//           },
//         ],
//         { session }
//       );

//       user = createdUser[0];
//       isNewUserCreated = true;
//     }

//     // =========================
//     // 👤 EXISTING USER
//     // =========================
//     else {
//       user = await UserModel.findById(userId).session(session);

//       if (!user) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(404).json({
//           success: false,
//           message: "User not found",
//         });
//       }
//     }

//     // =========================
//     // ❌ DUPLICATE STAFF CHECK
//     // =========================
//     const alreadyStaff = await StoreStaff.findOne({
//       store,
//       user: user._id,
//       role,
//     }).session(session);

//     if (alreadyStaff) {
//       await session.abortTransaction();
//       session.endSession();

//       return res.status(400).json({
//         success: false,
//         message: "User already has this role in this store",
//       });
//     }

//     // =========================
//     // 👥 CREATE STAFF
//     // =========================
//     const staff = await StoreStaff.create(
//       [
//         {
//           store,
//           user: user._id,
//           role,
//         },
//       ],
//       { session }
//     );

//   await UserModel.updateOne(
//   { _id: user._id },
//   { $addToSet: { roles: defaultRole._id } }, // ✅ always add USER role
//   { session }
// );

//     await session.commitTransaction();
//     session.endSession();

//     // =========================
//     // 📧 EMAIL
//     // =========================
//     if (isNewUserCreated && user.email) {
//       setImmediate(() => {
//         sendEmail(
//           user.email,
//           "Your Account Created",
//           `Hello ${user.fullName},

// Your account has been created.

// Username: ${user.email}
// Password: ${plainPassword}

// Please change password after login.`
//         );
//       });
//     }

//     return res.status(201).json({
//       success: true,
//       message: "Staff created successfully",
//       staff: staff[0],
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };


export const createStoreStaff = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { error } = createStaffSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    const { store, role, userOption, userId, newUser } = req.body;

    session.startTransaction();

    // =========================
    // 🔥 FETCH DEFAULT USER ROLE
    // =========================
    const defaultRole = await RoleModel.findOne({ role: "USER" }).session(session);
    if (!defaultRole) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ success: false, message: "Default USER role not found" });
    }

    // =========================
    // ✅ Store check
    // =========================
    const storeExists = await Store.findById(store).session(session);
    if (!storeExists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: "Store not found" });
    }

    // =========================
    // 🔐 Logged user role check
    // =========================
    const loggedUserRole = await getUserStoreRole(req.user, store);
    if (!loggedUserRole) {
      return res.status(403).json({ message: "No access To Create User" });
    }

    if (![STAFF_USER_ROLE.STORE_MANAGER, STAFF_USER_ROLE.OWNER, "FULL_ACCESS"].includes(loggedUserRole)) {
      return res.status(403).json({ message: "No access To Create User" });
    }

    let user;
    let plainPassword = null;
    let isNewUserCreated = false;

    const generatePassword = () => {
      const numbers = Math.floor(10000 + Math.random() * 90000);
      return `RM${numbers}R`;
    };

    // =========================
    // 👤 NEW USER CREATION
    // =========================
    if (userOption === "new") {
      const existingUser = await UserModel.findOne({
        $or: [
          { mobile: newUser.mobile },
          ...(newUser.email ? [{ email: newUser.email }] : []),
        ],
      }).session(session);

      if (existingUser) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Email or Mobile already registered",
        });
      }

      plainPassword = generatePassword();
      const hash = await bcrypt.hash(plainPassword, 8);

      const createdUser = await UserModel.create(
        [
          {
            fullName: newUser.fullName,
            mobile: newUser.mobile,
            email: newUser.email,
            passwordHash: hash,
            roles: [defaultRole._id], // ✅ default USER role
          },
        ],
        { session }
      );

      user = createdUser[0];
      isNewUserCreated = true;
    }

    // =========================
    // 👤 EXISTING USER
    // =========================
    else {
      user = await UserModel.findById(userId).session(session);

      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "User not found" });
      }
    }

    // =========================
    // ❌ DUPLICATE STAFF CHECK
    // =========================
    const alreadyStaff = await StoreStaff.findOne({
      store,
      user: user._id,
      role,
    }).session(session);

    if (alreadyStaff) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "User already has this role in this store",
      });
    }

    // =========================
    // 👥 CREATE STAFF
    // =========================
    const staff = await StoreStaff.create(
      [
        {
          store,
          user: user._id,
          role,
        },
      ],
      { session }
    );

    // =========================
    // 🔥 ENSURE USER HAS "USER" ROLE
    // =========================
    await UserModel.updateOne(
      { _id: user._id },
      { $addToSet: { roles: defaultRole._id } }, // duplicate safe
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // =========================
    // 📧 EMAIL NEW USER
    // =========================
    if (isNewUserCreated && user.email) {
      setImmediate(() => {
        sendEmail(
          user.email,
          "Your Account Created",
          `Hello ${user.fullName},

Your account has been created.

Username: ${user.email}
Password: ${plainPassword}

Please change password after login.`
        );
      });
    }

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff: staff[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




/* ================= GET ALL STAFF ================= */
export const getAllStoreStaff = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", store, role } = req.query;

    page = Number(page);
    limit = Number(limit);

    const filter = {};

    // 🔹 ROLE FILTER
    if (role) filter.role = role;

    // 🔍 SEARCH (USER BASED)
    if (search) {
      const users = await UserModel.find(
        { $text: { $search: search } },
        { _id: 1 }
      ).lean();

      filter.user = { $in: users.map(u => u._id) };
    }

    // 🔥 ACCESS FILTER (MAIN PART)
    const accessFilter = await buildStoreFilter(req.user, {
      field: "store",
      storeId: store // 👈 optional
    });

   
    const finalFilter = {
      ...filter,
      ...accessFilter
    };

    const [staff, total] = await Promise.all([
      StoreStaff.find(finalFilter)
        .populate("user", "fullName mobile")
        .populate("store", "storeName")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),

      StoreStaff.countDocuments(finalFilter)
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      staff
    });

  } catch (err) {
    console.error("GET STAFF ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ================= UPDATE STAFF ================= */
export const updateStoreStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, store } = req.body;


      const loggedUserRole = await getUserStoreRole(req.user, store);
    
        if (!loggedUserRole) { 
          return res.status(403).json({ message: "No access To Create User" });
        }
    
       
        if (![STAFF_USER_ROLE.STORE_MANAGER, STAFF_USER_ROLE.OWNER, "FULL_ACCESS"].includes(loggedUserRole)) {
          return res.status(403).json({ message: "No access To Create User" });
        }

    // ✅ Direct update (NO extra find → faster)
    const updatedStaff = await StoreStaff.findByIdAndUpdate(
      id,
      {
        ...(role && { role }),
        ...(store && { store }),
        ...(isActive !== undefined && { isActive }),
      },
      {
        new: true, // return updated data
        runValidators: true, // mongoose validation
      }
    );

    if (!updatedStaff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    return res.json({
      success: true,
      message: "Staff updated successfully",
      staff: updatedStaff,
    });

  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);

    // ⚡ duplicate case (unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "User already exists in this store",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};


export const updateStoreStaffIsAcitveInActive = async (req, res) => {
  try {
    const { id } = req.params;


    

    // 🔥 pehle staff find karo
    const staff = await StoreStaffModel.findById(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

      const loggedUserRole = await getUserStoreRole(req.user, staff?.store);
    
        if (!loggedUserRole) { 
          return res.status(403).json({ message: "No access To Create User" });
        }
    
       
        if (![STAFF_USER_ROLE.STORE_MANAGER, STAFF_USER_ROLE.OWNER, "FULL_ACCESS"].includes(loggedUserRole)) {
          return res.status(403).json({ message: "No access To Create User" });
        }

    // 🔥 toggle karo
    staff.isActive = !staff.isActive;

    await staff.save();

    return res.json({
      success: true,
      message: `Staff ${staff.isActive ? "Activated" : "Deactivated"}`,
      data: staff,
    });

  } catch (err) {
    console.error("UPDATE STAFF STATUS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= DELETE STAFF (SOFT DELETE) ================= */
export const deleteStoreStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Check if staff exists
    const staff = await StoreStaffModel.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found",
      });
    }

    // ✅ Get logged-in user's role for this store
    const loggedUserRole = await getUserStoreRole(req.user, staff.store);
    if (!loggedUserRole) { 
      return res.status(403).json({ message: "No access to delete staff" });
    }

    // ✅ Only allowed roles can delete
    if (![STAFF_USER_ROLE.STORE_MANAGER, STAFF_USER_ROLE.OWNER, "FULL_ACCESS"].includes(loggedUserRole)) {
      return res.status(403).json({ message: "No access to delete staff" });
    }

    // ✅ Delete staff
    await StoreStaffModel.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Staff deleted permanently",
    });

  } catch (err) {
    console.error("DELETE STAFF ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};



