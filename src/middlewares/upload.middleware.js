// import multer from "multer";
// import { CloudinaryStorage } from "multer-storage-cloudinary";
// import cloudinary from "../config/cloudinaryConfig.js";
// export const uploadImages = (folderName) => {
//   const storage = new CloudinaryStorage({
//     cloudinary,
//     params: {
//       folder: folderName,
//       allowed_formats: ["jpg", "jpeg", "png"],
//     },
//   });
//   return multer({ storage });
// };


import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";

// 🔹 Single image upload (for category, user, store logo)
export const singleImageUpload = (folder = "uploads") => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ["jpg","jpeg","png"],
    },
  });
  return multer({ storage }).single("image");
};



export const singleDbUpload = (folder = "uploads") => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ["jpg","jpeg","png"],
    },
  });
  return multer({ storage }).single("dp"); // ✅ field name must match frontend
};

// 🔹 Array of images upload (product images, banners, etc.)
export const arrayImageUpload = (folder = "uploads", maxCount = 10) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: ["jpg","jpeg","png"],
    },
  });
  return multer({ storage }).array("images", maxCount);
};

// 🔹 Array images + thumbnails upload (product full)
// export const arrayImagesThumbnailsUpload = (folder = "uploads", maxImages = 10, maxThumbs = 10) => {
//   const storage = new CloudinaryStorage({
//     cloudinary,
//     params: (req, file) => {
//       if (file.fieldname === "thumbnails") return { folder: "thumbnails", allowed_formats: ["jpg","jpeg","png"] };
//       return { folder, allowed_formats: ["jpg","jpeg","png"] };
//     },
//   });

//   const multerUpload = multer({ storage });
//   return multerUpload.fields([
//     { name: "images", maxCount: maxImages },
//     { name: "thumbnails", maxCount: maxThumbs },
//   ]);
// };



// 🔹 Memory storage (NO auto cloud upload)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});





export const arrayImagesThumbnailsUpload = (maxImages = 10, maxThumbs = 10) => {
  const upload = multer({ storage });

  return upload.fields([
    { name: "images", maxCount: maxImages },
    { name: "thumbnails", maxCount: maxThumbs },
  ]);
};



const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX files allowed"));
  }
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
