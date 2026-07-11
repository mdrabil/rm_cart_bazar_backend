// // import CMS from "../models/cms.model.js";
// // import { generateMRId } from "../utils/mrId.js";



// // /*
// // PAGE KEY MAPPING
// // */

// // const pageMap = {
// //   "return-policy": "returnPolicy",
// //   "privacy-policy": "privacyPolicy",
// //   "terms": "termsCondition"
// // };



// // /*
// // GET CMS PAGE (PUBLIC)
// // */

// // export const getCmsPage = async (req,res) => {

// //   try{

// //     const {type} = req.params;

// //     console.log("get type",type)

// //     const key = pageMap[type];

// //     if(!key){

// //       return res.status(400).json({
// //         success:false,
// //         message:"Invalid CMS type"
// //       });

// //     }

// //     const cms = await CMS.findOne();

// //     if(!cms){

// //       return res.status(404).json({
// //         success:false,
// //         message:"CMS not found"
// //       });

// //     }

// //     res.json({
// //       success:true,
// //       data:cms[key]
// //     });

// //   }catch(err){

// //     res.status(500).json({
// //       success:false,
// //       message:err.message
// //     });

// //   }

// // };




// // /*
// // CREATE OR UPDATE PAGE SETTINGS (ADMIN)
// // */

// // export const saveCmsPage = async (req,res) => {

// //   try{

// //     const {type} = req.params;

// //     const key = pageMap[type];

// //     if(!key){

// //       return res.status(400).json({
// //         success:false,
// //         message:"Invalid CMS type"
// //       });

// //     }

// //     const {
// //       seoTitle,
// //       seoDescription,
// //       pageTitle,
// //       pageDescription
// //     } = req.body;


// //     if(!seoTitle || !seoDescription || !pageTitle || !pageDescription){

// //       return res.status(400).json({
// //         success:false,
// //         message:"All fields are required"
// //       });

// //     }


// //     let cms = await CMS.findOne();

// //     if(!cms){

// //       cms = new CMS();
// //     }

// //     cms[key] = {
// //       ...cms[key],
// //       seoTitle,
// //       seoDescription,
// //       pageTitle,
// //       pageDescription,
// //       contents: cms[key]?.contents || []
// //     };

// //     await cms.save();


// //     res.json({
// //       success:true,
// //       message:"CMS page saved"
// //     });

// //   }catch(err){

// //     res.status(500).json({
// //       success:false,
// //       message:err.message
// //     });

// //   }

// // };




// // /*
// // ADD CONTENT (ADMIN)
// // */

// // export const addContent = async (req,res) => {

// //   try{

// //     const {type} = req.params;

// //     const key = pageMap[type];

// //     if(!key){

// //       return res.status(400).json({
// //         success:false,
// //         message:"Invalid CMS type"
// //       });

// //     }

// //     const {title,description} = req.body;

// //     if(!title || !description){

// //       return res.status(400).json({
// //         success:false,
// //         message:"Title and description required"
// //       });

// //     }

// //     const cms = await CMS.findOne();

// //     if(!cms){

// //       return res.status(404).json({
// //         success:false,
// //         message:"CMS not created"
// //       });

// //     }

// //     const mrContentId = await generateMRId("MRC","CMS_CONTENT");


// //     cms[key].contents.push({

// //       mrContentId,
// //       title,
// //       description

// //     });

// //     await cms.save();


// //     res.json({
// //       success:true,
// //       message:"Content added",
// //       mrContentId
// //     });

// //   }catch(err){

// //     res.status(500).json({
// //       success:false,
// //       message:err.message
// //     });

// //   }

// // };




// // /*
// // UPDATE CONTENT (ADMIN)
// // */

// // export const updateContent = async (req,res) => {

// //   try{

// //     const {type,contentId} = req.params;

// //     const key = pageMap[type];

// //     if(!key){

// //       return res.status(400).json({
// //         success:false,
// //         message:"Invalid CMS type"
// //       });

// //     }

// //     const {title,description} = req.body;

// //     if(!title || !description){

// //       return res.status(400).json({
// //         success:false,
// //         message:"Title and description required"
// //       });

// //     }

// //     const cms = await CMS.findOne();

// //     const content = cms[key].contents.find(
// //       c => c.mrContentId === contentId
// //     );

// //     if(!content){

// //       return res.status(404).json({
// //         success:false,
// //         message:"Content not found"
// //       });

// //     }

// //     content.title = title;
// //     content.description = description;

// //     await cms.save();


// //     res.json({
// //       success:true,
// //       message:"Content updated"
// //     });

// //   }catch(err){

// //     res.status(500).json({
// //       success:false,
// //       message:err.message
// //     });

// //   }

// // };




// // /*
// // DELETE CONTENT (ADMIN)
// // */

// // export const deleteContent = async (req,res) => {

// //   try{

// //     const {type,contentId} = req.params;

// //     const key = pageMap[type];

// //     if(!key){

// //       return res.status(400).json({
// //         success:false,
// //         message:"Invalid CMS type"
// //       });

// //     }

// //     const cms = await CMS.findOne();

// //     cms[key].contents = cms[key].contents.filter(
// //       c => c.mrContentId !== contentId
// //     );

// //     await cms.save();


// //     res.json({
// //       success:true,
// //       message:"Content deleted"
// //     });

// //   }catch(err){

// //     res.status(500).json({
// //       success:false,
// //       message:err.message
// //     });

// //   }

// // };



// import CMS from "../models/cms.model.js";
// import { generateMRId } from "../utils/mrId.js";

// /* helper */

// const typeMap = {
//   returnPolicy: "return-policy",
//   privacyPolicy: "privacy-policy",
//   termsCondition: "terms",
// };

// const validTypes = ["return-policy", "privacy-policy", "terms"];





// /* ==============================
//    GET CMS PAGES
// ============================== */

// export const getCmsPages = async (req, res) => {
//   try {

//     const pages = await CMS.find().sort({ createdAt: -1 });

//     return res.status(200).json({
//       success: true,
//       data: pages,
//     });

//   } catch (error) {

//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch CMS pages",
//       error: error.message,
//     });

//   }
// };



// /* ==============================
//    CREATE / UPDATE PAGE SETTINGS
// ============================== */

// export const saveCmsPage = async (req, res) => {

//   try {

// const rawType = req.params.type;

// const type = typeMap[rawType] || rawType;

// if (!validTypes.includes(type)) {
//   return res.status(400).json({
//     success: false,
//     message: "Invalid CMS page type",
//   });
// }


 

//     const {
//       seoTitle,
//       seoDescription,
//       pageTitle,
//       pageDescription,
//     } = req.body;

//     if (!seoTitle || !seoDescription || !pageTitle || !pageDescription) {
//       return res.status(400).json({
//         success: false,
//         message: "All fields are required",
//       });
//     }

//     let page = await CMS.findOne({ type });

//     if (!page) {

//       page = await CMS.create({
//         type,
//         seoTitle,
//         seoDescription,
//         pageTitle,
//         pageDescription,
//         contents: [],
//       });

//       return res.status(201).json({
//         success: true,
//         message: "CMS page created successfully",
//         data: page,
//       });

//     }

//     page.seoTitle = seoTitle;
//     page.seoDescription = seoDescription;
//     page.pageTitle = pageTitle;
//     page.pageDescription = pageDescription;

//     await page.save();

//     return res.status(200).json({
//       success: true,
//       message: "CMS page updated successfully",
//       data: page,
//     });

//   } catch (error) {

//     return res.status(500).json({
//       success: false,
//       message: "Failed to save CMS page",
//       error: error.message,
//     });

//   }

// };



// /* ==============================
//    ADD CONTENT
// ============================== */

// export const addCmsContent = async (req, res) => {

//   try {

// const rawType = req.params.type;

// const type = typeMap[rawType] || rawType;


//     if (!validTypes.includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid CMS page type",
//       });
//     }

//     const { title, description } = req.body;

//     if (!title || !description) {
//       return res.status(400).json({
//         success: false,
//         message: "Title and description are required",
//       });
//     }

//     const page = await CMS.findOne({ type });

//     if (!page) {
//       return res.status(404).json({
//         success: false,
//         message: "CMS page not found. Create page first",
//       });
//     }

//     const newId = generateMRId(type,type);

//     const newContent = {
//       mrContentId: newId,
//       title,
//       description,
//     };

//     page.contents.push(newContent);

//     await page.save();

//     return res.status(201).json({
//       success: true,
//       message: "Content added successfully",
//       data: newContent,
//     });

//   } catch (error) {

//     return res.status(500).json({
//       success: false,
//       message: "Failed to add content",
//       error: error.message,
//     });

//   }

// };



// /* ==============================
//    UPDATE CONTENT
// ============================== */

// export const updateCmsContent = async (req, res) => {

//   try {

//     const {  contentId } = req.params;

//     const rawType = req.params.type;

// const type = typeMap[rawType] || rawType;


//     const { title, description } = req.body;

//     if (!title || !description) {
//       return res.status(400).json({
//         success: false,
//         message: "Title and description are required",
//       });
//     }

//     const page = await CMS.findOne({ type });

//     if (!page) {
//       return res.status(404).json({
//         success: false,
//         message: "CMS page not found",
//       });
//     }

//     const content = page.contents.find(
//       (c) => c.mrContentId === contentId
//     );

//     if (!content) {
//       return res.status(404).json({
//         success: false,
//         message: "Content not found",
//       });
//     }

//     content.title = title;
//     content.description = description;

//     await page.save();

//     return res.status(200).json({
//       success: true,
//       message: "Content updated successfully",
//       data: content,
//     });

//   } catch (error) {

//     return res.status(500).json({
//       success: false,
//       message: "Failed to update content",
//       error: error.message,
//     });

//   }

// };



// /* ==============================
//    DELETE CONTENT
// ============================== */

// export const deleteCmsContent = async (req, res) => {

//   try {

//     const { type, contentId } = req.params;

// //     const rawType = req.params.type;

// // const type = typeMap[rawType] || rawType;


//     const page = await CMS.findOne({ type });

//     if (!page) {
//       return res.status(404).json({
//         success: false,
//         message: "CMS page not found",
//       });
//     }

//     const index = page.contents.findIndex(
//       (c) => c.mrContentId === contentId
//     );

//     if (index === -1) {
//       return res.status(404).json({
//         success: false,
//         message: "Content not found",
//       });
//     }

//     page.contents.splice(index, 1);

//     await page.save();

//     return res.status(200).json({
//       success: true,
//       message: "Content deleted successfully",
//     });

//   } catch (error) {

//     return res.status(500).json({
//       success: false,
//       message: "Failed to delete content",
//       error: error.message,
//     });

//   }

// };


import CMS from "../models/cms.model.js";
import { generateMRId } from "../utils/mrId.js";

// ===========================
// TYPE MAP
// ===========================
const typeMap = {
  returnPolicy: "returnPolicy",
  privacyPolicy: "privacyPolicy",
  termsCondition: "termsCondition",
  "return-policy": "returnPolicy",
  "privacy-policy": "privacyPolicy",
  terms: "termsCondition",
};

const validTypes = [
  "returnPolicy",
  "privacyPolicy",
  "termsCondition",
  "return-policy",
  "privacy-policy",
  "terms",
];

// Prefix map for RMId
const prefixMap = {
  returnPolicy: "RPS",
  privacyPolicy: "PVC",
  termsCondition: "TERM",
};

// ===========================
// GET CMS PAGES
// ===========================
export const getCmsPages = async (req, res) => {
  try {
    let cms = await CMS.findOne();

    if (!cms) {
      // create empty CMS with all pages
      cms = await CMS.create({
        returnPolicy: {
          seoTitle: "Return Policy",
          seoDescription: "Return Policy Description",
          pageTitle: "Return Policy",
          pageDescription: "Return Policy Details",
          contents: [],
        },
        privacyPolicy: {
          seoTitle: "Privacy Policy",
          seoDescription: "Privacy Policy Description",
          pageTitle: "Privacy Policy",
          pageDescription: "Privacy Policy Details",
          contents: [],
        },
        termsCondition: {
          seoTitle: "Terms & Conditions",
          seoDescription: "Terms Description",
          pageTitle: "Terms & Conditions",
          pageDescription: "Terms Details",
          contents: [],
        },
      });
    }

    return res.status(200).json({ success: true, data: cms });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch CMS pages",
      error: error.message,
    });
  }
};

// ===========================
// SAVE / UPDATE PAGE
// ===========================
export const saveCmsPage = async (req, res) => {
  try {
    const rawType = req.params.type;

    if (!validTypes.includes(rawType)) {
      return res.status(400).json({ success: false, message: "Invalid CMS type" });
    }

    const field = typeMap[rawType];

    const { seoTitle, seoDescription, pageTitle, pageDescription } = req.body;

    if (!seoTitle || !seoDescription || !pageTitle || !pageDescription) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    let cms = await CMS.findOne();

    if (!cms) {
      cms = await CMS.create({});
    }

    // if section missing, create it
    if (!cms[field]) {
      cms[field] = {
        seoTitle,
        seoDescription,
        pageTitle,
        pageDescription,
        contents: [],
      };
    } else {
      cms[field].seoTitle = seoTitle;
      cms[field].seoDescription = seoDescription;
      cms[field].pageTitle = pageTitle;
      cms[field].pageDescription = pageDescription;
    }

    await cms.save();

    return res.status(200).json({ success: true, message: "CMS page saved successfully", data: cms[field] });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to save CMS page", error: error.message });
  }
};

// ===========================
// ADD CONTENT
// ===========================
export const addCmsContent = async (req, res) => {
  try {
    const rawType = req.params.type;

    if (!validTypes.includes(rawType)) {
      return res.status(400).json({ success: false, message: "Invalid CMS type" });
    }

    const field = typeMap[rawType];

    const { title, description, seoTitle, seoDescription, pageTitle, pageDescription } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    let cms = await CMS.findOne();

    if (!cms) {
      // create CMS document with all pages
      cms = await CMS.create({
        returnPolicy: {
          seoTitle: "Return Policy",
          seoDescription: "Return Policy Description",
          pageTitle: "Return Policy",
          pageDescription: "Return Policy Details",
          contents: [],
        },
        privacyPolicy: {
          seoTitle: "Privacy Policy",
          seoDescription: "Privacy Policy Description",
          pageTitle: "Privacy Policy",
          pageDescription: "Privacy Policy Details",
          contents: [],
        },
        termsCondition: {
          seoTitle: "Terms & Conditions",
          seoDescription: "Terms Description",
          pageTitle: "Terms & Conditions",
          pageDescription: "Terms Details",
          contents: [],
        },
      });
    }

    // if section missing, create it
    if (!cms[field]) {
      cms[field] = {
        seoTitle: seoTitle || "",
        seoDescription: seoDescription || "",
        pageTitle: pageTitle || "",
        pageDescription: pageDescription || "",
        contents: [],
      };
    }

    // ensure contents array exists
    if (!cms[field].contents) cms[field].contents = [];

    // generate RMId
    const newId = await generateMRId(prefixMap[field]);

    const newContent = { mrContentId: newId, title, description };
    cms[field].contents.push(newContent);

    await cms.save();

    return res.status(201).json({ success: true, message: "Content added successfully", data: newContent });
  } catch (error) {
    console.error("ERROR ADDING CMS CONTENT:", error);
    return res.status(500).json({ success: false, message: "Failed to add content", error: error.message });
  }
};

// ===========================
// UPDATE CONTENT
// ===========================
export const updateCmsContent = async (req, res) => {
  try {
    const { type, contentId } = req.params;

    if (!validTypes.includes(type)) return res.status(400).json({ success: false, message: "Invalid CMS type" });

    const field = typeMap[type];
    const { title, description } = req.body;

    if (!title || !description) return res.status(400).json({ success: false, message: "Title and description required" });

    const cms = await CMS.findOne();

    if (!cms || !cms[field]) return res.status(404).json({ success: false, message: "CMS page not found" });

    const content = cms[field].contents.find(c => c.mrContentId === contentId);

    if (!content) return res.status(404).json({ success: false, message: "Content not found" });

    content.title = title;
    content.description = description;

    await cms.save();

    return res.status(200).json({ success: true, message: "Content updated successfully", data: content });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update content", error: error.message });
  }
};

// ===========================
// DELETE CONTENT
// ===========================
export const deleteCmsContent = async (req, res) => {
  try {
    const { type, contentId } = req.params;

    if (!validTypes.includes(type)) return res.status(400).json({ success: false, message: "Invalid CMS type" });

    const field = typeMap[type];

    const cms = await CMS.findOne();

    if (!cms || !cms[field]) return res.status(404).json({ success: false, message: "CMS page not found" });

    const index = cms[field].contents.findIndex(c => c.mrContentId === contentId);

    if (index === -1) return res.status(404).json({ success: false, message: "Content not found" });

    cms[field].contents.splice(index, 1);
    await cms.save();

    return res.status(200).json({ success: true, message: "Content deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete content", error: error.message });
  }
};