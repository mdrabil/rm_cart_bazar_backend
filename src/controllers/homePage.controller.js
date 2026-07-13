// import Home from "../models/HomePage.model.js";
// import cloudinary from "../config/cloudinaryConfig.js";
// import asyncHandler from "express-async-handler";

// // Helper to validate allowed fields
// const validateFields = (data, allowedFields) => {
//   const validated = {};
//   allowedFields.forEach((field) => {
//     if (data[field] !== undefined) validated[field] = data[field];
//   });
//   return validated;
// };

// // GET Home
// export const getHome = asyncHandler(async (req, res) => {
//   const home = await Home.findOne();
//   if (!home) {
//     return res.json({
//       hero: {},
//       promo: {},
//       countdown: {},
//       newsletter: {},
//     });
//   }
//   res.json(home);
// });

// // CREATE Home (only admin, single document)
// export const createHome = asyncHandler(async (req, res) => {
//   if (!req.user) return res.status(401).json({ message: "User not logged in" });

//   const existing = await Home.findOne();
//   if (existing) return res.status(400).json({ message: "Home already exists" });

//   const allowedSections = ["hero", "promo", "countdown", "newsletter"];
//   const homeData = {};

//   for (const section of allowedSections) {
//     if (req.body[section]) {
//       homeData[section] = validateFields(req.body[section], [
//         "title", "subtitle", "description", "discount", "buttonText", "buttonLink", "endDate"
//       ]);
//       homeData[section].createdBy = req.user._id;

//       // Image upload per section
//       if (req.files && req.files[section]) {
//         const file = req.files[section][0];
//         const uploadRes = await cloudinary.uploader.upload(file.path, { folder: `home/${section}` });
//         homeData[section].image = {
//           url: uploadRes.secure_url,
//           public_id: uploadRes.public_id,
//         };
//       }
//     }
//   }

//   const home = await Home.create(homeData);
//   res.status(201).json(home);
// });

// // UPDATE Section (hero/promo/countdown/newsletter)
// export const updateSection = asyncHandler(async (req, res) => {
//   if (!req.user) return res.status(401).json({ message: "User not logged in" });

//   const { section } = req.params;
//   const home = await Home.findOne();
//   if (!home) return res.status(404).json({ message: "Home not found" });

//   const allowedFields = ["title", "subtitle", "description", "discount", "buttonText", "buttonLink", "endDate"];
//   const updateData = validateFields(req.body, allowedFields);
//   updateData.updatedBy = req.user._id;

//   // Image upload
//   if (req.files && req.files.image) {
//     if (home[section]?.image?.public_id) {
//       await cloudinary.uploader.destroy(home[section].image.public_id);
//     }
//     const file = req.files.image[0];
//     const uploadRes = await cloudinary.uploader.upload(file.path, { folder: `home/${section}` });
//     updateData.image = {
//       url: uploadRes.secure_url,
//       public_id: uploadRes.public_id,
//     };
//   }

//   home[section] = { ...home[section]._doc, ...updateData };
//   await home.save();

//   res.json(home);
// });

// // DELETE Section Image
// export const deleteSectionImage = asyncHandler(async (req, res) => {
//   const { section } = req.params;
//   const home = await Home.findOne();
//   if (!home) return res.status(404).json({ message: "Home not found" });

//   if (home[section]?.image?.public_id) {
//     await cloudinary.uploader.destroy(home[section].image.public_id);
//   }

//   home[section].image = { url: "", public_id: "" };
//   home[section].updatedBy = req.user._id;
//   await home.save();

//   res.json(home);
// });

import Home from "../models/HomePage.model.js";
import cloudinary from "../config/cloudinaryConfig.js";
import streamifier from "streamifier";

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "home-page" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};


// Convert req.body heroCarousel[x][field] -> array
const parseArrayFields = (body, key) => {
  const result = [];

  Object.keys(body).forEach((k) => {
    if (k.startsWith(key)) {
      const match = k.match(/\[(\d+)\]\[(.*?)\]/);

      if (match) {
        const index = parseInt(match[1]);
        const field = match[2];

        if (!result[index]) result[index] = {};
        result[index][field] = body[k];
      }
    }
  });

  return result;
};



export const createOrUpdateHome = async (req, res) => {
  try {

    const heroCarousel = parseArrayFields(req.body, "heroCarousel");

    const deletedImages = req.body.deletedImages
      ? Array.isArray(req.body.deletedImages)
        ? req.body.deletedImages
        : [req.body.deletedImages]
      : [];


    // delete cloudinary images
    if (deletedImages.length) {
      await Promise.all(
        deletedImages.map((id) => cloudinary.uploader.destroy(id))
      );
    }


    const files = req.files || {};


    // Upload heroCarousel images
    if (files.heroCarousel) {

      for (let i = 0; i < files.heroCarousel.length; i++) {

        if (!heroCarousel[i]) heroCarousel[i] = {};

        const result = await uploadToCloudinary(files.heroCarousel[i]);

        heroCarousel[i].image = {
          url: result.secure_url,
          public_id: result.public_id,
        };
      }
    }



    let home = await Home.findOne();


    if (!home) {

      home = new Home({
        heroCarousel,
      });

    } else {

      home.heroCarousel = heroCarousel;

    }


    await home.save();


    res.json({
      success: true,
      message: "Home page updated successfully",
      data: home,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Helper: upload single image to Cloudinary
// const uploadImage = async (filePath, folder) => {
//   const result = await cloudinary.uploader.upload(filePath, { folder });
//   fs.unlinkSync(filePath); // remove temp file
//   return { url: result.secure_url, public_id: result.public_id };
// };



// export const createOrUpdateHome = async (req, res) => {
//   try {
//     const {
//       heroCarousel,
//       heroFeatures,
//       heroProducts,
//       promoBig,
//       promoSmall,
//       countdown,
//       newsletter,
//       deletedImages = [],
//     } = req.body;


//     console.log("data",req.body)
//     console.log("files",req.files)
//     // 1️⃣ Validation: required fields check
//     const errors = [];
//     const parseJSON = (str) => {
//       try { return JSON.parse(str); } catch { return str; }
//     };

//     const heroCarouselData = parseJSON(heroCarousel || "[]");
//     const heroFeaturesData = parseJSON(heroFeatures || "[]");
//     const heroProductsData = parseJSON(heroProducts || "[]");
//     const promoBigData = parseJSON(promoBig || "{}");
//     const promoSmallData = parseJSON(promoSmall || "[]");
//     const countdownData = parseJSON(countdown || "{}");
//     const newsletterData = parseJSON(newsletter || "{}");

//     heroCarouselData.forEach((slide, i) => {
//       if (!slide.title) errors.push(`Hero slide ${i+1} title required`);
//     });
//     heroFeaturesData.forEach((feat, i) => {
//       if (!feat.title) errors.push(`Feature ${i+1} title required`);
//     });
//     heroProductsData.forEach((prod, i) => {
//       if (!prod.name) errors.push(`Product ${i+1} name required`);
//       if (!prod.price) errors.push(`Product ${i+1} price required`);
//     });

//     if (errors.length > 0) return res.status(400).json({ success: false, errors });

//     // 2️⃣ Delete images from Cloudinary if in deletedImages
//     for (const public_id of deletedImages) {
//       await cloudinary.uploader.destroy(public_id);
//     }

//     // 3️⃣ Upload new images from req.files
//     const uploadSectionImages = async (sectionArray, fieldName, folderName) => {
//       return await Promise.all(sectionArray.map(async (item, idx) => {
//         if (req.files && req.files[`${fieldName}[${idx}]`]) {
//           const uploaded = await uploadImage(req.files[`${fieldName}[${idx}]`][0].path, folderName);
//           item.image = uploaded;
//         } else if (item.image && item.image.url) {
//           // keep existing
//         } else {
//           item.image = { url: "", public_id: "" };
//         }
//         return item;
//       }));
//     };

//     const heroCarouselFinal = await uploadSectionImages(heroCarouselData, "heroCarousel", "home/heroCarousel");
//     const heroFeaturesFinal = await uploadSectionImages(heroFeaturesData, "heroFeatures", "home/heroFeatures");
//     const heroProductsFinal = await uploadSectionImages(heroProductsData, "heroProducts", "home/heroProducts");

//     // Single objects
//     const uploadSingleImage = async (item, field, folderName) => {
//       if (req.files && req.files[field]) {
//         const uploaded = await uploadImage(req.files[field][0].path, folderName);
//         item.image = uploaded;
//       } else if (!item.image) item.image = { url: "", public_id: "" };
//       return item;
//     };

//     const promoBigFinal = await uploadSingleImage(promoBigData, "promoBig", "home/promoBig");
//     const countdownFinal = await uploadSingleImage(countdownData, "countdown", "home/countdown");
//     const newsletterFinal = await uploadSingleImage(newsletterData, "newsletter", "home/newsletter");

//     // Promo small array
//     const promoSmallFinal = await uploadSectionImages(promoSmallData, "promoSmall", "home/promoSmall");

//     // 4️⃣ Save to DB
//     let home = await Home.findOne();
//     const dataToSave = {
//       heroCarousel: heroCarouselFinal,
//       heroFeatures: heroFeaturesFinal,
//       heroProducts: heroProductsFinal,
//       promoBanner: { bigBanner: promoBigFinal, smallBanners: promoSmallFinal },
//       countdown: countdownFinal,
//       newsletter: newsletterFinal,
//     };

//     if (home) {
//       await Home.updateOne({}, { $set: dataToSave });
//       home = await Home.findOne();
//     } else {
//       home = await Home.create(dataToSave);
//     }

//     res.json({ success: true, data: home });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };
// UPDATE Section
export const updateSection = async (req, res) => {
  const { section } = req.params;
  const home = await HomePage.findOne();
  if (!home) return res.status(404).json({ success: false, message: "Home page not found" });

  const data = req.body;

  // If image is uploaded
  if (req.file) {
    const uploaded = await uploadImage(req.file.buffer, section);
    data.image = { url: uploaded.secure_url, public_id: uploaded.public_id };
  }

  // Update nested section
  home[section] = { ...home[section]._doc, ...data };
  await home.save();

  res.status(200).json({ success: true, message: `${section} updated successfully`, data: home[section] });
};

// DELETE Section Image
export const deleteSectionImage = async (req, res) => {
  const { section } = req.params;
  const { public_id } = req.body;

  const home = await HomePage.findOne();
  if (!home) return res.status(404).json({ success: false, message: "Home page not found" });

  // Delete from Cloudinary
  if (public_id) await cloudinary.uploader.destroy(public_id);

  // Remove from DB
  if (home[section]?.image?.public_id === public_id) home[section].image = null;

  await home.save();
  res.status(200).json({ success: true, message: "Image deleted successfully" });
};




export const getHome = async (req, res) => {
  const home = await Home.findOne();
  console.log("get data",home)
  if (!home) return res.status(404).json({ success: false, message: "Home page not found" });
  res.status(200).json({ success: true, message: "Home page fetched successfully", data: home });
};


// GET Home Data (Only status:true items)
export const getHomeData = async (req, res) => {
  try {
    const homeData = await Home.findOne({}).lean();

    if (!homeData) return res.status(404).json({ message: "Home data not found" });

    // Filter only active items
    homeData.heroCarousel = homeData.heroCarousel?.filter(item => item.status);
    homeData.heroFeatures = homeData.heroFeatures?.filter(item => item.status);
    homeData.heroProducts = homeData.heroProducts?.filter(item => item.status);
    homeData.promoBanner.smallBanners = homeData.promoBanner?.smallBanners?.filter(item => item.status);
    if (homeData.promoBanner?.bigBanner?.status === false) homeData.promoBanner.bigBanner = null;
    if (homeData.countdown?.status === false) homeData.countdown = null;
    if (homeData.newsletter?.status === false) homeData.newsletter = null;

   res.status(200).json({ success: true, message: "Home page fetched successfully", data: homeData });
  } catch (error) {
    console.error("Error fetching Home data:", error);
    return res.status(500).json({ message: error.message });
  }
};