import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: String,
  public_id: String
},{_id:false})

const contactSchema = new mongoose.Schema({

  title:{
    type:String
  },

  subtitle:{
    type:String
  },

  image:imageSchema,

  contactInfo:{
    phone:String,
    email:String,
    emergencyNumber:String,
    supportNumber:String
  },

  whatsapp:{
    number:String,
    text:String
  },

  address:{
    type:String
  },

  personalMail:{
    type:String
  }

},{timestamps:true})

export default mongoose.model("Contact",contactSchema)