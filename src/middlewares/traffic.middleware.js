// // middleware/traffic.middleware.js

// import Traffic from "../models/Traffic.js";

// /* =================================
//    SAVE TRAFFIC
// ================================= */

// export const saveTraffic =
//   async (req, res, next) => {
//     try {
//       await Traffic.create({
//         ip:
//           req.headers[
//             "x-forwarded-for"
//           ] ||
//           req.socket.remoteAddress,

//         userAgent:
//           req.headers["user-agent"],

//         path: req.originalUrl,

//         method: req.method,

//         referer:
//           req.headers.referer || "",
//       });

//       next();
//     } catch (error) {
//       console.log(
//         "Traffic Error:",
//         error.message
//       );

//       next();
//     }
//   };





import Traffic from "../models/Traffic.js";

export const saveTraffic =
  async (req, res, next) => {


    try {

        // ignore static files
        const ignoredExtensions = [
            ".css",
            ".js",
            ".png",
            ".jpg",
            ".jpeg",
            ".svg",
            ".webp",
            ".ico",
        ];
        
        const isIgnored =
        ignoredExtensions.some((ext) =>
            req.path.endsWith(ext)
    );
    
    if (isIgnored) {
        return next();
    }
    
    // user IP
    const ip =
    req.headers[
        "x-forwarded-for"
    ] ||
    req.socket.remoteAddress ||
    "";
  // console.log("gete the ip",ip)

      // today date
      const today =
        new Date()
          .toISOString()
          .split("T")[0];

      // check already visited today
      const existingVisitor =
        await Traffic.findOne({
          ip,
          visitDate: today,
        });

      // if not exist then save
      if (!existingVisitor) {
        await Traffic.create({
          ip,

          userAgent:
            req.headers[
              "user-agent"
            ] || "",

          visitDate: today,
        });
      }

      next();
    } catch (error) {
      console.log(error.message);

      next();
    }
  };