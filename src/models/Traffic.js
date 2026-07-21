// models/Traffic.js

import mongoose from "mongoose";

const trafficSchema =
  new mongoose.Schema(
    {
      ip: {
        type: String,
        required: true,
      },

      userAgent: {
        type: String,
        default: "",
      },

      visitDate: {
        type: String,
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

const Traffic = mongoose.model(
  "Traffic",
  trafficSchema
);

export default Traffic;