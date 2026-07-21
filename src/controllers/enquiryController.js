import { sendEmail } from "../constants/mailer.js";
import Enquiry from "../models/Enquiry.model.js";
import { sendTemplateEmail } from "../services/email/email.service.js";
import { generateMRId } from "../utils/mrId.js";


// export const createEnquiry = async (req, res) => {
//   try {
//     const { fullName, email, phone, message, subject } = req.body;

//     // =========================
//     // 🔥 VALIDATION CHECKS
//     // =========================
//     if (!fullName || !email || !phone || !message) {
//       return res.status(400).json({
//         success: false,
//         message: "Full name, email, phone and message are required",
//       });
//     }

//     // phone check
//     if (!/^[0-9]{10}$/.test(phone)) {
//       return res.status(400).json({
//         success: false,
//         message: "Phone must be 10 digit number",
//       });
//     }

//     // email check
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid email format",
//       });
//     }

//     const mrEnquiryId = await generateMRId("ENQ", "ENQUIRY");

//     const enquiry = await Enquiry.create({
//       mrEnquiryId,
//       fullName,
//       email,
//       phone,
//       message,
//       subject,
//     });

//     // =========================
//     // 🔥 BEAUTIFUL EMAIL TEMPLATE
//     // =========================
//     const htmlTemplate = `
//     <div style="font-family:Arial;background:#f6f6f6;padding:20px;">
//       <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px;border:1px solid #eee">

//         <h2 style="color:#0d6efd;">📩 New Enquiry Received</h2>

//         <p><strong>Enquiry ID:</strong> ${mrEnquiryId}</p>
//         <hr/>

//         <p><strong>Full Name:</strong> ${fullName}</p>
//         <p><strong>Email:</strong> ${email}</p>
//         <p><strong>Phone:</strong> ${phone}</p>
//         <p><strong>Subject:</strong> ${subject || "N/A"}</p>

//         <p style="margin-top:10px;"><strong>Message:</strong></p>
//         <p style="background:#f1f1f1;padding:10px;border-radius:5px;">
//           ${message}
//         </p>

//         <hr/>
//         <p style="font-size:12px;color:gray;">
//           This is an automated notification from enquiry system.
//         </p>
//       </div>
//     </div>
//     `;

//     await sendEmail({
//       to: process.env.ADMIN_EMAIL,
//       subject: `New Enquiry Received - ${mrEnquiryId}`,
//       html: htmlTemplate,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "Enquiry created successfully",
//       data: enquiry,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };






export const createEnquiry = async (req, res) => {
  try {

    const {
      fullName,
      email,
      phone,
      message,
      subject
    } = req.body;



    // =========================
    // VALIDATION
    // =========================

    if (!fullName || !email || !phone || !message) {

      return res.status(400).json({
        success:false,
        message:
        "Full name, email, phone and message are required",
      });

    }



    if (!/^[0-9]{10}$/.test(phone)) {

      return res.status(400).json({
        success:false,
        message:"Phone must be 10 digit number",
      });

    }



    const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if(!emailRegex.test(email)){

      return res.status(400).json({
        success:false,
        message:"Invalid email format",
      });

    }



    // =========================
    // CREATE ENQUIRY ID
    // =========================

    const mrEnquiryId =
    await generateMRId(
      "ENQ",
      "ENQUIRY"
    );



    // =========================
    // SAVE DATABASE
    // =========================

    const enquiry =
    await Enquiry.create({

      mrEnquiryId,

      fullName,

      email,

      phone,

      message,

      subject,

    });



    // =========================
    // EMAIL DATA
    // =========================

    const enquiryData = {

      customerName: fullName,

      fullName,

      email,

      phone,

      subject: subject || "General Enquiry",

      message,

      enquiryId: mrEnquiryId,

    };




    // =========================
    // ADMIN EMAIL
    // =========================

    await sendTemplateEmail({

      type:
      EMAIL_TYPE.ENQUIRY_RECEIVED_ADMIN,


      to:
      process.env.ADMIN_EMAIL,


      data:
      enquiryData,

    });





    // =========================
    // CUSTOMER CONFIRMATION EMAIL
    // =========================

    await sendTemplateEmail({

      type:
      EMAIL_TYPE.ENQUIRY_CONFIRMATION_CUSTOMER,


      to:
      email,


      data:
      enquiryData,

    });





    return res.status(201).json({

      success:true,

      message:
      "Enquiry created successfully",

      data: enquiry,

    });



  } catch(error){


    console.error(
      "Create Enquiry Error:",
      error
    );


    return res.status(500).json({

      success:false,

      message:error.message,

    });


  }
};
export const getAllEnquiries = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;

    page = Number(page);
    limit = Number(limit);

  const query = {
  $or: [
    { fullName: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
    { phone: { $regex: search, $options: "i" } },
    { mrEnquiryId: { $regex: search, $options: "i" } },
    { subject: { $regex: search, $options: "i" } }, // ✅ added
  ],
};

    const total = await Enquiry.countDocuments(query);

    const data = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const updated = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteEnquiry = async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};