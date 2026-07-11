import mongoose from "mongoose";
import { config } from "./config.js";

export const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      tls: config.mongoTls,
    };

    if (config.mongoTlsAllowInvalid) {
      options.tlsAllowInvalidCertificates = true;
    }

    await mongoose.connect(config.mongoURI, options);

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected — retrying on next request");
    });

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
