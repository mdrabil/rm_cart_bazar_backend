// import express from "express";

// import {
// getCmsPage,
// saveCmsPage,
// addContent,
// updateContent,
// deleteContent
// } from "../controllers/cms.controller.js";
// import { adminOnly } from "../middlewares/adminOnly.js";


// const router = express.Router();


// router.get("/:type",getCmsPage);

// router.post("/:type",adminOnly,saveCmsPage);

// router.post("/:type/content",adminOnly,addContent);

// router.put("/:type/content/:contentId",adminOnly,updateContent);

// router.delete("/:type/content/:contentId",adminOnly,deleteContent);


// export default router;




import express from "express";
import {
  getCmsPages,
  saveCmsPage,
  addCmsContent,
  updateCmsContent,
  deleteCmsContent
} from "../controllers/cms.controller.js";

const router = express.Router();


router.get("/get", getCmsPages);

router.post("/save/:type", saveCmsPage);

router.post("/content/:type", addCmsContent);

router.put("/content/:type/:contentId", updateCmsContent);

router.delete("/content/:type/:contentId", deleteCmsContent);


export default router;