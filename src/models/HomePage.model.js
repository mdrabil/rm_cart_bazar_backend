
// import mongoose from "mongoose";

// const imageSchema = new mongoose.Schema({
//   url: { type: String, default: "" },
//   public_id: { type: String, default: "" },
// });

// const heroSchema = new mongoose.Schema({
//   heroCarousel: [
//     {
//       title: { type: String, default: "" },
//       subtitle: { type: String, default: "" },
//       description: { type: String, default: "" },
//       image: { type: imageSchema, default: () => ({}) },
//       link: { type: String, default: "" },
//       discount: { type: String, default: "" },
//       status: { type: Boolean, default: true },
//     },
//   ],
//   heroFeatures: [
//     {
//       title: { type: String, default: "" },
//       description: { type: String, default: "" },
//       image: { type: imageSchema, default: () => ({}) },
//       status: { type: Boolean, default: true },
//     },
//   ],
//   heroProducts: [
//     {
//       name: { type: String, default: "" },
//       price: { type: Number, default: 0 },
//       sellingPrice: { type: Number, default: 0 },
//       image: { type: imageSchema, default: () => ({}) },
//       link: { type: String, default: "" },
//       offerText: { type: String, default: "" },
//       status: { type: Boolean, default: true },
//     },
//   ],
//   countdown: {
//     title: { type: String, default: "" },
//     subtitle: { type: String, default: "" },
//     description: { type: String, default: "" },
//     deadline: { type: Date },
//     productImage: { type: imageSchema, default: () => ({}) },
//     backgroundImage: { type: imageSchema, default: () => ({}) },
//     link: { type: String, default: "" },
//     status: { type: Boolean, default: true },
//   },
//   promoBanner: {
//     bigBanner: {
//       title: { type: String, default: "" },
//       subtitle: { type: String, default: "" },
//       description: { type: String, default: "" },
//       image: { type: imageSchema, default: () => ({}) },
//       link: { type: String, default: "" },
//       status: { type: Boolean, default: true },
//     },
//     smallBanners: [
//       {
//         title: { type: String, default: "" },
//         subtitle: { type: String, default: "" },
//         description: { type: String, default: "" },
//         image: { type: imageSchema, default: () => ({}) },
//         link: { type: String, default: "" },
//         bgColor: { type: String, default: "#FFFFFF" },
//         status: { type: Boolean, default: true },
//       },
//     ],
//   },
//   newsletter: {
//     title: { type: String, default: "" },
//     description: { type: String, default: "" },
//     backgroundImage: { type: imageSchema, default: () => ({}) },
//     gradientOverlay: { type: String, default: "" },
//     status: { type: Boolean, default: true },
//   },
// }, { timestamps: true });

// const HeroPage = mongoose.model("HeroPage", heroSchema);
// export default HeroPage;



// import mongoose from "mongoose";

// const imageSchema = new mongoose.Schema({
//   url: { type: String, default: "" },
//   public_id: { type: String, default: "" },
// });

// const heroSlideSchema = new mongoose.Schema({
//   title: String,
//   subtitle: String,
//   description: String,
//   link: String,
//   discount: String,
//   image: imageSchema,
//   status: { type: Boolean, default: true },
// });

// const featureSchema = new mongoose.Schema({
//   title: String,
//   description: String,
//   image: imageSchema,
//   status: { type: Boolean, default: true },
// });

// const productSchema = new mongoose.Schema({
//   name: String,
//   price: Number,
//   sellingPrice: Number,
//   link: String,
//   offerText: String,
//   image: imageSchema,
//   status: { type: Boolean, default: true },
// });

// const promoSmallSchema = new mongoose.Schema({
//   title: String,
//   subtitle: String,
//   description: String,
//   bgColor: { type: String, default: "#FFFFFF" },
//   image: imageSchema,
//   status: { type: Boolean, default: true },
// });

// const promoBigSchema = new mongoose.Schema({
//   title: String,
//   subtitle: String,
//   description: String,
//   image: imageSchema,
//   status: { type: Boolean, default: true },
// });

// const countdownSchema = new mongoose.Schema({
//   title: String,
//   subtitle: String,
//   description: String,
//   deadline: Date,
//   productImage: imageSchema,
//   status: { type: Boolean, default: true },
// });

// const newsletterSchema = new mongoose.Schema({
//   title: String,
//   description: String,
//   backgroundImage: imageSchema,
//   gradientOverlay: String,
//   status: { type: Boolean, default: true },
// });

// const homeSchema = new mongoose.Schema({
//   heroCarousel: [heroSlideSchema],
//   heroFeatures: [featureSchema],
//   heroProducts: [productSchema],
//   promoBanner: {
//     bigBanner: promoBigSchema,
//     smallBanners: [promoSmallSchema],
//   },
//   countdown: countdownSchema,
//   newsletter: newsletterSchema,
// }, { timestamps: true });

// export default mongoose.model("Home", homeSchema);



import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: String,
  public_id: String
}, { _id: true });

const heroCarouselSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  description: String,
  link: String,
  discount: String,
  image: imageSchema,
  status: { type: Boolean, default: true }
});

const heroFeatureSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: imageSchema,
  status: { type: Boolean, default: true }
});

const heroProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  sellingPrice: Number,
  link: String,
  offerText: String,
  image: imageSchema,
  status: { type: Boolean, default: true }
});

const promoSmallSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  description: String,
  bgColor: String,
  image: imageSchema,
  status: { type: Boolean, default: true }
});

const promoBigSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  description: String,
  image: imageSchema,
  status: { type: Boolean, default: true }
});

const countdownSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  description: String,
  deadline: Date,
  productImage: imageSchema,
  status: { type: Boolean, default: true }
});

const newsletterSchema = new mongoose.Schema({
  title: String,
  description: String,
  gradientOverlay: String,
  backgroundImage: imageSchema,
  status: { type: Boolean, default: true }
});

const homeSchema = new mongoose.Schema({

  heroCarousel: [heroCarouselSchema],

  heroFeatures: [heroFeatureSchema],

  heroProducts: [heroProductSchema],

  promoBanner: {
    smallBanners: [promoSmallSchema],
    bigBanner: promoBigSchema
  },

  countdown: countdownSchema,

  newsletter: newsletterSchema

}, { timestamps: true });

export default mongoose.model("Home", homeSchema);