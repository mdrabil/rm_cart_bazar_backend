import Role from "../models/Role.model.js";
import { STATUS } from "../constants/enums.js";


// ✅ Create Role (ADMIN ONLY)
export const createRole = async (req, res) => {
  try {
    const { role, description } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role name required",
      });
    }

    // Check already exists
    const exists = await Role.findOne({ role });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Role already exists",
      });
    }

    const newRole = await Role.create({
      role,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: newRole,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const getAllRoles = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const status = req.query.status;

    let query = {
      $and: [
        { role: { $ne: "SUPER_ADMIN" } } // 🔥 ALWAYS EXCLUDE
      ]
    };

    // 🔍 Search
    if (search) {
      query.$and.push({
        role: { $regex: search, $options: "i" }
      });
    }

    // 🔍 Filter
    if (status) {
      query.$and.push({ status });
    }

    const total = await Role.countDocuments(query);

    const roles = await Role.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      roles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ✅ Get Single Role
export const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ✅ Update Role
export const updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Check duplicate role name
    if (role) {
      const exists = await Role.findOne({
        role,
        _id: { $ne: req.params.id },
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Role already exists",
        });
      }
    }

    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedRole) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};




export const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // ✅ Hard delete
    await Role.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Role deleted permanently",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// ✅ Toggle Role Status (Active / Inactive)
export const toggleRoleStatus = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    role.isActive = !role.isActive;
    role.status = role.isActive ? STATUS.ACTIVE : STATUS.INACTIVE;

    await role.save();

    res.json({
      success: true,
      message: "Role status updated",
      data: role,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};