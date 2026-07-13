import bcrypt from "bcryptjs";
import { config } from "../config/config.js";

export const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  return bcrypt.hash(plainPassword, salt);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
