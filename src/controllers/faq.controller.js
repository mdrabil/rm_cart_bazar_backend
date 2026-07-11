import Faq from "../models/Faq.model.js";
import { generateMRId } from "../utils/mrId.js";


// CREATE OR UPDATE FAQ PAGE
export const upsertFaqPage = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      seoTitle,
      seoDescription,
      pageTitle,
      pageDescription
    } = req.body;

    if (!pageTitle) {
      return res.status(400).json({
        message: "Page title is required",
      });
    }

    let faqPage = await Faq.findOne();

    if (!faqPage) {

      faqPage = await Faq.create({
        seoTitle,
        seoDescription,
        pageTitle,
        pageDescription,
        createdBy: req.user._id,
      });

    } else {

      faqPage.seoTitle = seoTitle;
      faqPage.seoDescription = seoDescription;
      faqPage.pageTitle = pageTitle;
      faqPage.pageDescription = pageDescription;

      await faqPage.save();
    }

    res.json({
      message: "FAQ page saved successfully",
      faqPage,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// PUBLIC FAQ PAGE
export const getFaqPage = async (req, res) => {
  try {

    const faqPage = await Faq.findOne()
      .select("-createdBy");

    if (!faqPage) {
      return res.status(404).json({
        message: "FAQ page not found",
      });
    }

    res.status(200).json({
      success:true,
     data:faqPage,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};




export const getFaqAdmin = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Try to find the FAQ page
    let faqPage = await Faq.findOne().populate("createdBy", "fullName email");

    // If not found, create a new one
    if (!faqPage) {
      faqPage = await Faq.create({
        pageTitle: "FAQ Page",
        pageDescription: "This is your FAQ page. You can update it.",
        faqs: [],
        createdBy: req.user._id, // assign logged-in admin as creator
      });

      // Populate the createdBy field
      faqPage = await faqPage.populate("createdBy", "name email");
    }

    res.json({ faqPage });

  } catch (error) {
    console.error("Error in getFaqAdmin:", error);
    res.status(500).json({ message: error.message });
  }
};

// ADD FAQ
export const addFaq = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        message: "Question and answer are required",
      });
    }

    const faqPage = await Faq.findOne();

    if (!faqPage) {
      return res.status(404).json({
        message: "FAQ page not found",
      });
    }

    const mrFaqId = await generateMRId("FAQ", "FAQ");

    const newFaq = {
      question,
      answer,
      mrFaqId,
    };

    faqPage.faqs.push(newFaq);

    await faqPage.save();

    res.json({
      message: "FAQ added successfully",
      faq: faqPage.faqs[faqPage.faqs.length - 1],
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// UPDATE FAQ
export const updateFaq = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;
    const { question, answer } = req.body;

    const faqPage = await Faq.findOne();

    if (!faqPage) {
      return res.status(404).json({
        message: "FAQ page not found",
      });
    }

    const faq = faqPage.faqs.id(id);

    if (!faq) {
      return res.status(404).json({
        message: "FAQ not found",
      });
    }

    if (question) faq.question = question;
    if (answer) faq.answer = answer;

    await faqPage.save();

    res.json({
      message: "FAQ updated successfully",
      faq,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};



// DELETE FAQ
export const deleteFaq = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { id } = req.params;

    const faqPage = await Faq.findOne();

    if (!faqPage) {
      return res.status(404).json({
        message: "FAQ page not found",
      });
    }

    const faq = faqPage.faqs.id(id);

    if (!faq) {
      return res.status(404).json({
        message: "FAQ not found",
      });
    }

    faq.deleteOne();

    await faqPage.save();

    res.json({
      message: "FAQ deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};