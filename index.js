import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import routes from "./src/routes/mainRoutes.js";
import { connectDB } from "./src/config/db.js";
import { config } from "./src/config/config.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import { webhookRawBody } from "./src/payment/config.js";
import Payment from "./src/payment/index.js";
import { initSocket } from "./src/sockets/socket.js";

if (
  process.env.NODE_ENV !== "production" &&
  process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0"
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const app = express();
const server = http.createServer(app);

app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/api/payment/webhook", webhookRawBody);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === "production" ? 500 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

connectDB();

Payment.startRetryWorker(60_000);

app.use("/api", apiLimiter, routes);

app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

app.use(errorHandler);

initSocket(server);

server.listen(config.port, "0.0.0.0", () => {
  console.log(`Server + Socket running on port ${config.port}`);
});
