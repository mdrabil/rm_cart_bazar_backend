import mongoose from "mongoose";



const contentSchema = new mongoose.Schema({

  mrContentId:{
    type:String,
    required:true
  },

  title:{
    type:String,
    required:true,
    trim:true
  },

  description:{
    type:String,
    required:true
  },

  createdAt:{
    type:Date,
    default:Date.now
  }

});



const pageSchema = new mongoose.Schema({

  seoTitle:{
    type:String,
    required:true,
    trim:true
  },

  seoDescription:{
    type:String,
    required:true,
    trim:true
  },

  pageTitle:{
    type:String,
    required:true
  },

  pageDescription:{
    type:String,
    required:true
  },

  contents:[contentSchema]

});



const cmsSchema = new mongoose.Schema({

  returnPolicy:pageSchema,

  privacyPolicy:pageSchema,

  termsCondition:pageSchema

},{
  timestamps:true
});



export default mongoose.model("CMS",cmsSchema);