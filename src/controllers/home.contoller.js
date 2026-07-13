// import Home from "../models/HomePage.model.js";
// import cloudinary from "../config/cloudinaryConfig.js";

// import streamifier from "streamifier";

// const uploadToCloudinary = (file) => {
//   return new Promise((resolve, reject) => {

//     const stream = cloudinary.uploader.upload_stream(
//       { folder: "home-page" },
//       (error, result) => {
//         if (result) resolve(result);
//         else reject(error);
//       }
//     );

//     streamifier.createReadStream(file.buffer).pipe(stream);
//   });
// };

// export const createHome = async (req, res) => {
//   try {

//     let home = await Home.findOne();

//     if (!home) home = new Home();

//     const body = req.body;
//     const files = req.files || [];

//     console.log("get body",body)
//     console.log("get files",files)

//     // ---------- HERO CAROUSEL ----------
//     const heroCarousel = [];

//     if (body.heroCarousel) {

//       const arr = Array.isArray(body.heroCarousel)
//         ? body.heroCarousel
//         : Object.values(body.heroCarousel);

//       for (let i = 0; i < arr.length; i++) {

//         const item = arr[i];
//         let image = null;

//         const file = files.find(f => f.fieldname === `heroCarousel[${i}][image]`);

//         if (file) {
//           const upload = await uploadToCloudinary(file);
//           image = {
//             url: upload.secure_url,
//             public_id: upload.public_id
//           };
//         }

//         heroCarousel.push({
//           ...item,
//           image
//         });

//       }

//     }

//     home.heroCarousel = heroCarousel;

//     // ---------- HERO FEATURES ----------

//     const heroFeatures = [];

//     if (body.heroFeatures) {

//       const arr = Object.values(body.heroFeatures);

//       for (let i = 0; i < arr.length; i++) {

//         const item = arr[i];
//         let image = null;

//         const file = files.find(f => f.fieldname === `heroFeatures[${i}][image]`);

//         if (file) {

//           const upload = await uploadToCloudinary(file);

//           image = {
//             url: upload.secure_url,
//             public_id: upload.public_id
//           };

//         }

//         heroFeatures.push({
//           ...item,
//           image
//         });

//       }

//     }

//     home.heroFeatures = heroFeatures;

//     // ---------- HERO PRODUCTS ----------

//     const heroProducts = [];

//     if (body.heroProducts) {

//       const arr = Object.values(body.heroProducts);

//       for (let i = 0; i < arr.length; i++) {

//         const item = arr[i];

//         let image = null;

//         const file = files.find(f => f.fieldname === `heroProducts[${i}][image]`);

//         if (file) {

//           const upload = await uploadToCloudinary(file);

//           image = {
//             url: upload.secure_url,
//             public_id: upload.public_id
//           };

//         }

//         heroProducts.push({
//           ...item,
//           image
//         });

//       }

//     }

//     home.heroProducts = heroProducts;

//     // ---------- PROMO SMALL ----------

//     const smallBanners = [];

//     if (body.promoSmall) {

//       const arr = Object.values(body.promoSmall);

//       for (let i = 0; i < arr.length; i++) {

//         const item = arr[i];
//         let image = null;

//         const file = files.find(f => f.fieldname === `promoSmall[${i}][image]`);

//         if (file) {

//           const upload = await uploadToCloudinary(file);

//           image = {
//             url: upload.secure_url,
//             public_id: upload.public_id
//           };

//         }

//         smallBanners.push({
//           ...item,
//           image
//         });

//       }

//     }

//     home.promoBanner.smallBanners = smallBanners;

//     // ---------- BIG PROMO ----------

//     if (body.promoBig) {

//       const file = files.find(f => f.fieldname === "promoBig[image]");

//       let image = null;

//       if (file) {

//         const upload = await uploadToCloudinary(file);

//         image = {
//           url: upload.secure_url,
//           public_id: upload.public_id
//         };

//       }

//       home.promoBanner.bigBanner = {
//         ...body.promoBig,
//         image
//       };

//     }

//     // ---------- COUNTDOWN ----------

//     if (body.countdown) {

//       const file = files.find(f => f.fieldname === "countdown[productImage]");

//       let productImage = null;

//       if (file) {

//         const upload = await uploadToCloudinary(file);

//         productImage = {
//           url: upload.secure_url,
//           public_id: upload.public_id
//         };

//       }

//       home.countdown = {
//         ...body.countdown,
//         productImage
//       };

//     }

//     // ---------- NEWSLETTER ----------

//     if (body.newsletter) {

//       const file = files.find(f => f.fieldname === "newsletter[backgroundImage]");

//       let backgroundImage = null;

//       if (file) {

//         const upload = await uploadToCloudinary(file);

//         backgroundImage = {
//           url: upload.secure_url,
//           public_id: upload.public_id
//         };

//       }

//       home.newsletter = {
//         ...body.newsletter,
//         backgroundImage
//       };

//     }

//     await home.save();

//     res.json({
//       success: true,
//       message: "Home page updated successfully",
//       data: home
//     });

//   } catch (error) {

//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: error.message
//     });

//   }
// };





import Home from "../models/HomePage.model.js";
import cloudinary from "../config/cloudinaryConfig.js";
import streamifier from "streamifier";

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "home-page" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const createHome = async (req, res) => {
  try {

  if (!req.user) return res.status(401).json({ success: false, message: "User not logged in" });


    let home = await Home.findOne();

    if (!home) home = new Home();

    const body = req.body;
    const files = req.files || [];

    // ---------- DELETE OLD IMAGES ----------
    if (body.deletedImages) {

      const deleted = Array.isArray(body.deletedImages)
        ? body.deletedImages
        : [body.deletedImages];

      for (const id of deleted) {
        await cloudinary.uploader.destroy(id);
      }

    }

    // ---------- HERO CAROUSEL ----------
    const heroCarousel = [];

    if (body.heroCarousel) {

      const arr = Array.isArray(body.heroCarousel)
        ? body.heroCarousel
        : Object.values(body.heroCarousel);

      for (let i = 0; i < arr.length; i++) {

        const item = arr[i];

        let image = item.image || home.heroCarousel?.[i]?.image || null;

        const file = files.find(
          (f) => f.fieldname === `heroCarousel[${i}][image]`
        );

        if (file) {

          const upload = await uploadToCloudinary(file);

          image = {
            url: upload.secure_url,
            public_id: upload.public_id,
          };

        }

        heroCarousel.push({
          ...item,
          image,
        });

      }

    }

    home.heroCarousel = heroCarousel;

    // ---------- HERO FEATURES ----------
    const heroFeatures = [];

    if (body.heroFeatures) {

      const arr = Array.isArray(body.heroFeatures)
        ? body.heroFeatures
        : Object.values(body.heroFeatures);

      for (let i = 0; i < arr.length; i++) {

        const item = arr[i];

        let image = item.image || home.heroFeatures?.[i]?.image || null;

        const file = files.find(
          (f) => f.fieldname === `heroFeatures[${i}][image]`
        );

        if (file) {

          const upload = await uploadToCloudinary(file);

          image = {
            url: upload.secure_url,
            public_id: upload.public_id,
          };

        }

        heroFeatures.push({
          ...item,
          image,
        });

      }

    }

    home.heroFeatures = heroFeatures;

    // ---------- HERO PRODUCTS ----------
    const heroProducts = [];

    if (body.heroProducts) {

      const arr = Array.isArray(body.heroProducts)
        ? body.heroProducts
        : Object.values(body.heroProducts);

      for (let i = 0; i < arr.length; i++) {

        const item = arr[i];

        let image = item.image || home.heroProducts?.[i]?.image || null;

        const file = files.find(
          (f) => f.fieldname === `heroProducts[${i}][image]`
        );

        if (file) {

          const upload = await uploadToCloudinary(file);

          image = {
            url: upload.secure_url,
            public_id: upload.public_id,
          };

        }

        heroProducts.push({
          ...item,
          image,
        });

      }

    }

    home.heroProducts = heroProducts;

    // ---------- PROMO SMALL ----------
    const smallBanners = [];

    if (body.promoSmall) {

      const arr = Array.isArray(body.promoSmall)
        ? body.promoSmall
        : Object.values(body.promoSmall);

      for (let i = 0; i < arr.length; i++) {

        const item = arr[i];

        let image =
          item.image ||
          home.promoBanner?.smallBanners?.[i]?.image ||
          null;

        const file = files.find(
          (f) => f.fieldname === `promoSmall[${i}][image]`
        );

        if (file) {

          const upload = await uploadToCloudinary(file);

          image = {
            url: upload.secure_url,
            public_id: upload.public_id,
          };

        }

        smallBanners.push({
          ...item,
          image,
        });

      }

    }

    if (!home.promoBanner) home.promoBanner = {};

    home.promoBanner.smallBanners = smallBanners;

    // ---------- BIG PROMO ----------
    if (body.promoBig) {

      let image =
        body.promoBig.image ||
        home.promoBanner?.bigBanner?.image ||
        null;

      const file = files.find((f) => f.fieldname === "promoBig[image]");

      if (file) {

        const upload = await uploadToCloudinary(file);

        image = {
          url: upload.secure_url,
          public_id: upload.public_id,
        };

      }

      if (!home.promoBanner) home.promoBanner = {};

      home.promoBanner.bigBanner = {
        ...body.promoBig,
        image,
      };

    }

    // ---------- COUNTDOWN ----------
    if (body.countdown) {

      let productImage =
        body.countdown.productImage ||
        home.countdown?.productImage ||
        null;

      const file = files.find(
        (f) => f.fieldname === "countdown[productImage]"
      );

      if (file) {

        const upload = await uploadToCloudinary(file);

        productImage = {
          url: upload.secure_url,
          public_id: upload.public_id,
        };

      }

      home.countdown = {
        ...body.countdown,
        productImage,
      };

    }

    // ---------- NEWSLETTER ----------
    if (body.newsletter) {

      let backgroundImage =
        body.newsletter.backgroundImage ||
        home.newsletter?.backgroundImage ||
        null;

      const file = files.find(
        (f) => f.fieldname === "newsletter[backgroundImage]"
      );

      if (file) {

        const upload = await uploadToCloudinary(file);

        backgroundImage = {
          url: upload.secure_url,
          public_id: upload.public_id,
        };

      }

      home.newsletter = {
        ...body.newsletter,
        backgroundImage,
      };

    }

    await home.save();

    res.json({
      success: true,
      message: "Home page updated successfully",
      data: home,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
export const getHome = async (req, res) => {

  try {

    const home = await Home.findOne();

    res.json({
      success: true,
      message: "Home page fetched successfully",
      data: home
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};