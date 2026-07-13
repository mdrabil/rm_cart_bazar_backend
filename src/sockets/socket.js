import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import StoreStaff from "../models/StoreStaff.model.js";
import { config } from "../config/config.js";
import { USER_ROLE } from "../constants/enums.js";

let io;

async function resolveAdminUser(token) {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (!decoded?.userId) return null;

  const user = await User.findById(decoded.userId)
    .populate("roles", "role")
    .select("-passwordHash -refreshToken")
    .lean();

  if (!user || user.isBlocked) return null;

  const roles = (user.roles || [])
    .map((r) => r.role?.trim().toUpperCase())
    .filter(Boolean);

  if (!roles.length) return null;

  return { _id: user._id, roles };
}

async function canJoinStore(userId, roles, storeId) {
  if (!storeId) return false;
  if (roles.includes(USER_ROLE.SUPER_ADMIN) || roles.includes(USER_ROLE.ADMIN)) {
    return true;
  }
  const staff = await StoreStaff.findOne({ store: storeId, user: userId }).lean();
  return Boolean(staff);
}

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const adminUser = await resolveAdminUser(token);
      if (!adminUser) {
        return next(new Error("Unauthorized"));
      }
      socket.adminUser = adminUser;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("join:admin", () => {
      const roles = socket.adminUser?.roles || [];
      if (roles.includes(USER_ROLE.SUPER_ADMIN) || roles.includes(USER_ROLE.ADMIN)) {
        socket.join("admin");
      }
    });

    socket.on("join:store", async (storeId) => {
      if (!storeId || !socket.adminUser) return;
      const allowed = await canJoinStore(
        socket.adminUser._id,
        socket.adminUser.roles,
        storeId
      );
      if (allowed) {
        socket.join(`store:${storeId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("❌ Socket.io not initialized");
  }
  return io;
};
