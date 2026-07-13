import mongoose from "mongoose";
import dotenv from "dotenv";
import { runInitialSeeder } from "./initialSeeder.js";
import { seedPaymentGateways } from "./paymentGatewaySeeder.js";

dotenv.config();

const startSeeder = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ DB Connected");

    await runInitialSeeder();
    await seedPaymentGateways();

    console.log("🌱 Seeding Done");
    process.exit();
  } catch (error) {
    console.error("❌ Seeder Error:", error);
    process.exit(1);
  }
};

startSeeder();