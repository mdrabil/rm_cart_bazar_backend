import express from "express";

import { addAddress, changeCustomerPassword, createCustomer, customerLogin, customerLogout, deleteAddress, deleteCustomerAddress, sendEmailOtp, setDefaultAddress, updateAddress, updateCustomerDp, updateCustomerProfile, verifyEmailOtp } from "../../controllers/customer.controller.js";
import { getLanguagePreference, updateLanguagePreference } from "../../controllers/languagePreference.controller.js";
import { customerAuth } from "../../middlewares/customerAuth.middleware.js";
import { singleDbUpload } from "../../middlewares/upload.middleware.js";
import { resetPassword, sendOtp, verifyOtp } from "../../controllers/customer/CustomerAppOtp.controller.js";

const router = express.Router();

// Register customer
router.post("/signup", createCustomer);
router.post("/login", customerLogin);
router.post("/logout", customerLogout);
router.delete("/address/:addressId", customerAuth, deleteCustomerAddress);
router.put("/update-profile", customerAuth, updateCustomerProfile);
router.put("/change-password", customerAuth, changeCustomerPassword);
router.put(
  "/change-user-dp",
  customerAuth,
    singleDbUpload("dp"),
  updateCustomerDp
);
router.post("/add/address", customerAuth, addAddress);
router.put("/update/address/:addressId", customerAuth, updateAddress);
router.delete("/delete/address/:addressId", customerAuth, deleteAddress);
router.put("/set-default/address/:addressId", customerAuth, setDefaultAddress);

// router.post("/register", customerRegister);


router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.post("/send-email-otp", sendEmailOtp);
router.post("/verify-email-otp", verifyEmailOtp);

router.get("/language", customerAuth, getLanguagePreference);
router.put("/language", customerAuth, updateLanguagePreference);

export default router;
