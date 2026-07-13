import Contact from "../../models/Contact.model.js"
import cloudinary from "../../config/cloudinaryConfig.js"
import streamifier from "streamifier"

const uploadToCloudinary = (file)=>{
  return new Promise((resolve,reject)=>{

    const stream = cloudinary.uploader.upload_stream(
      {folder:"contact-page"},
      (error,result)=>{
        if(result) resolve(result)
        else reject(error)
      }
    )

    streamifier.createReadStream(file.buffer).pipe(stream)

  })
}

export const createOrUpdateContact = async(req,res)=>{
  try{

    let contact = await Contact.findOne()

    if(!contact) contact = new Contact()

    const body = req.body
    const file = req.file

    let image = contact.image || null

    if(file){

      const upload = await uploadToCloudinary(file)

      image = {
        url:upload.secure_url,
        public_id:upload.public_id
      }

    }

    contact.title = body.title
    contact.subtitle = body.subtitle

    contact.image = image

    contact.contactInfo = {
      phone:body.phone,
      email:body.email,
      emergencyNumber:body.emergencyNumber,
      supportNumber:body.supportNumber
    }

    contact.whatsapp = {
      number:body.whatsappNumber,
      text:body.whatsappText
    }

    contact.address = body.address
    contact.personalMail = body.personalMail

    await contact.save()

    res.json({
      success:true,
      message:"Contact page updated",
      data:contact
    })

  }catch(err){

    res.status(500).json({
      success:false,
      message:err.message
    })

  }
}


export const getContact = async(req,res)=>{
  try{

    const data = await Contact.findOne()

    res.json({
      success:true,
      data
    })

  }catch(err){

    res.status(500).json({
      success:false,
      message:err.message
    })

  }
}





// Optional: specify projection to return only needed fields
const CONTACT_FIELDS = {
  title: 1,
  subtitle: 1,
  image: 1,
  contactInfo: 1,
  whatsapp: 1,
  address: 1,
  personalMail: 1
};

export const getContactPublic = async (req, res) => {
  try {
    // Fetch only the first (or main) contact
    const data = await Contact.findOne({}, CONTACT_FIELDS).lean().exec();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Contact info not found"
      });
    }

    return res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error("GetContact Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact info"
    });
  }
};