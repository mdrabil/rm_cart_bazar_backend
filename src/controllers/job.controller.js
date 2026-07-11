import Job from "../models/Jobs.model.js";
import JobApplicationModel from "../models/JobApplication.model.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { generateMRId } from "../utils/mrId.js";

/* =========================
   CREATE JOB
========================= */
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      salary,
      requirements,
      status,
      startDate,
      endDate,
    } = req.body;

    // Required validation
    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, Description, Start Date and End Date are required",
      });
    }

    if (title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Title must be at least 3 characters",
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be greater than start date",
      });
    }

    // Prevent duplicate job title (same start date)
    const existing = await Job.findOne({
      title: title.trim(),
      startDate: new Date(startDate),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Job already exists with same title and start date",
      });
    }

    const mrJobId = await generateMRId('Job',"Job")

    const job = await Job.create({
      mrJobId,
      title: title.trim(),
      description: description.trim(),
      salary: salary?.trim() || "Not disclosed",
      requirements: Array.isArray(requirements)
        ? requirements
        : [],
      status: status || "open",
      startDate,
      endDate,
      jobCreatedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   GET ALL JOBS
========================= */
export const getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 8, search = "", status } = req.query;

    const query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (status) {
      query.status = status;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      jobs,
      total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   UPDATE JOB
========================= */
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      salary,
      requirements,
      status,
      startDate,
      endDate,
    } = req.body;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (startDate && endDate) {
      if (new Date(endDate) <= new Date(startDate)) {
        return res.status(400).json({
          success: false,
          message: "End date must be greater than start date",
        });
      }
    }

    job.title = title?.trim() || job.title;
    job.description = description?.trim() || job.description;
    job.salary = salary?.trim() || job.salary;
    job.requirements = Array.isArray(requirements)
      ? requirements
      : job.requirements;
    job.status = status || job.status;
    job.startDate = startDate || job.startDate;
    job.endDate = endDate || job.endDate;

    await job.save();

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================
   DELETE JOB
========================= */
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};




export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const application = await JobApplicationModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.json({
      message: "Status updated",
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



export const applyJob = async (req, res) => {
  try {
    const { jobId, name, email, phone, experience, shortDesc } = req.body;

    // ======================
    // BASIC VALIDATION
    // ======================
  console.log("file:", req.file);
console.log("body:", req.body);

    if (!jobId || !name || !email || !phone) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Resume is required",
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
      });
    }

    if (job.status !== "open") {
      return res.status(400).json({
        message: "Job is closed",
      });
    }

    const alreadyApplied = await JobApplicationModel.findOne({
      jobId,
      email,
    });

    if (alreadyApplied) {
      return res.status(400).json({
        message: "You already applied for this job",
      });
    }

    // ======================
    // CLOUDINARY UPLOAD
    // ======================

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "job_resumes",
          resource_type: "raw",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    // ======================
    // CREATE APPLICATION
    // ======================

    const mrAppliedJobId = await generateMRId("AplJob","ApplicaitonJobs")

    const application = await JobApplicationModel.create({
      mrAppliedJobId,
      jobId,
      name,
      email,
      phone,
      experience,
      shortDesc,

      resume: {
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      },
    });

    // increase applied count
    await Job.findByIdAndUpdate(jobId, {
      $inc: { appliedCount: 1 },
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

export const getApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
    } = req.query;

    const match = {};

    // ======================
    // STATUS FILTER
    // ======================
    if (status) {
      match.status = status;
    }

    // ======================
    // SEARCH FILTER
    // ======================
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // ======================
    // DATE FILTER
    // ======================
    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        match.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        match.createdAt.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      JobApplicationModel.find(match)
        .populate("jobId", "title salary")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      JobApplicationModel.countDocuments(match),
    ]);

    res.json({
      applications,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


export const getSingleApplication = async (req, res) => {
  try {
    const application = await JobApplicationModel.findById(req.params.id)
      .populate("jobId", "title salary description");

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.json({
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



export const deleteApplication = async (req, res) => {
  try {
    const application = await JobApplicationModel.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    // ======================
    // DELETE CLOUDINARY FILE
    // ======================

    if (application.resume?.public_id) {
      await cloudinary.uploader.destroy(
        application.resume.public_id,
        { resource_type: "raw" }
      );
    }

    // ======================
    // DELETE DB
    // ======================

    await JobApplicationModel.findByIdAndDelete(req.params.id);

    // decrease appliedCount
    await Job.findByIdAndUpdate(application.jobId, {
      $inc: { appliedCount: -1 },
    });

    res.json({
      message: "Application deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};


export const getApplicationsByUser = async (req, res) => {
  try {
    const { email, phone, page = 1, limit = 10 } = req.query;

    if (!email && !phone) {
      return res.status(400).json({
        message: "Email or phone is required",
      });
    }

    const match = {};

    if (email) {
      match.email = email.toLowerCase();
    }

    if (phone) {
      match.phone = phone;
    }

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      JobApplicationModel.find(match)
        .populate("jobId", "title salary status startDate endDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      JobApplicationModel.countDocuments(match),
    ]);

    res.json({
      applications,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};