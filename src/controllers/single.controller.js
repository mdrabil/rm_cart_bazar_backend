// controllers/single.controller.js

import CounterModel from "../models/Counter.model.js";

// GET ALL COUNTERS
export const getAllCounters = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const query = search
      ? {
          _id: {
            $regex: search,
            $options: "i",
          },
        }
      : {};

    const total = await CounterModel.countDocuments(query);

    const counters = await CounterModel.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      counters,
      total,
      page,
      limit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE COUNTER
export const updateCounter = async (req, res) => {
  try {
    const { id } = req.params;
    const { seq } = req.body;

    const counter = await CounterModel.findByIdAndUpdate(
      id,
      { seq },
      { new: true }
    );

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Counter not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Counter updated successfully",
      counter,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE COUNTER
export const deleteCounter = async (req, res) => {
  try {
    const { id } = req.params;

    const counter = await CounterModel.findByIdAndDelete(id);

    if (!counter) {
      return res.status(404).json({
        success: false,
        message: "Counter not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Counter deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};