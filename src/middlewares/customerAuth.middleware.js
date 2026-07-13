// middleware/customerAuth.middleware.js
import jwt from "jsonwebtoken";

import Customer from "../models/Customer.js";
import { config } from "../config/config.js";


export const customerAuth = async (req, res, next) => {
  try {
    // 1️⃣ Get Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify Token
    const decoded = jwt.verify(token, config.jwtSecret);

    // 3️⃣ Get Customer from DB
    const customer = await Customer.findById(decoded.id).select("-password");
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 4️⃣ Block Check
    if (customer.isBlocked) {
      return res.status(403).json({
    success: false,
    message: "🚫 Your account has been temporarily blocked by the admin. Please contact support for assistance."
  });

    }


    // console.log("get the data",customer)

    // 5️⃣ Attach Customer to Request
    req.user = customer;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(401).json({
      success: false,
      message: "Token expired or invalid",
    });
  }
};



export const customerauthMiddlewareOptional = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(); // no login, continue
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Customer.findById(decoded.id);
    if (user) req.user = user;
  } catch (err) {
    console.warn("Optional auth failed:", err.message);
  }

  next();
};