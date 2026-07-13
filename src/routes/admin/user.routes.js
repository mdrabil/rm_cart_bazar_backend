import express from "express";


import { MODULE_KEY, USER_ROLE } from "../../constants/enums.js";
import {
  createUser,
  updateUser,
  getUserById,
  getAllUsers,
  deleteUser,
  updateUserProfile,
  toggleUserStatus
} from "../../controllers/user.controller.js";

import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { singleDbUpload } from "../../middlewares/upload.middleware.js";

const router = express.Router();


// Create User → SUPER_ADMIN only
router.post(
  "/create",
  authMiddleware,
   checkPermission(MODULE_KEY.GLOBAL_USERS, "create"),
  createUser
);


router.put(
  "/profile",
  authMiddleware,
    singleDbUpload("dp"),
  updateUserProfile
);

// Update User → SUPER_ADMIN can update anyone, user can update self
router.put(
  "/:userId",
  authMiddleware,
  checkPermission(MODULE_KEY.GLOBAL_USERS, "update"),
  updateUser
);


router.patch(
  "/:id/toggle-status",
  authMiddleware,
  checkPermission(MODULE_KEY.GLOBAL_USERS, "update"),
  toggleUserStatus
);

// Get User → SUPER_ADMIN all, user can get self
router.get(
  "/:userId",
  authMiddleware,
  getUserById
);

// Get All Users → SUPER_ADMIN only
router.get(
  "/",
  authMiddleware,
checkPermission(MODULE_KEY.GLOBAL_USERS, "read"),
  getAllUsers
);

// Delete User → SUPER_ADMIN only
router.delete(
  "/:userId",
  authMiddleware,
 checkPermission(MODULE_KEY.GLOBAL_USERS, "delete"),
  deleteUser
);

export default router;
