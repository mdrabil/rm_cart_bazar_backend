import express from "express";

import { MODULE_KEY, STAFF_USER_ROLE, USER_ROLE } from "../../constants/enums.js";

import {
  createStore,
  updateStore,
  getStoreById,
  getAllStores,
  deleteStore,
  updateStoreOnly
} from "../../controllers/store.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { allowRoles, allowStoreRoles } from "../../middlewares/allowStoreRoles.js";

const router = express.Router();

// Create Store → SUPER_ADMIN / VENDOR
router.post(
  "/create",
  authMiddleware,
  checkPermission(MODULE_KEY.STORES,'create'),
  allowRoles([USER_ROLE.SUPER_ADMIN,USER_ROLE.ADMIN,USER_ROLE.VENDOR ]),
  createStore
);

// router.post("/update", authMiddleware, checkPermission(MODULE_KEY.STORE, "update"), updateStoreOnly);
router.post("/toggle/:id", authMiddleware, checkPermission(MODULE_KEY.STORES, "update"),
  allowRoles([USER_ROLE.SUPER_ADMIN,USER_ROLE.ADMIN,USER_ROLE.VENDOR ]),
 updateStoreOnly);


// Update Store → Owner / Manager / SUPER_ADMIN
router.patch(
  "/update/:storeId",
  authMiddleware,
   checkPermission(MODULE_KEY.STORES,'update'),
   allowStoreRoles([STAFF_USER_ROLE.STORE_MANAGER,STAFF_USER_ROLE.OWNER,USER_ROLE.SUPER_ADMIN]),
 
  updateStore
);

// Get Store → Owner / Manager / SUPER_ADMIN
router.get(
  "/:storeId",
  authMiddleware,
   checkPermission(MODULE_KEY.STORES,'read'),

  getStoreById
);

// Get all stores → SUPER_ADMIN sees all, VENDOR sees own stores
router.get(
  "/",
  authMiddleware,
   checkPermission(MODULE_KEY.STORES,'read'),
  getAllStores
);

// Delete Store → SUPER_ADMIN only
router.delete(
  "/:id",
  authMiddleware,
  allowStoreRoles([STAFF_USER_ROLE.OWNER]),
 checkPermission(MODULE_KEY.STORES,'delete'),
  deleteStore
);

export default router;
