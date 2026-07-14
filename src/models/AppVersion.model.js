// import mongoose from "mongoose";

// const appVersionSchema = new mongoose.Schema(
//   {
//     platform: {
//       type: String,
//       enum: ["android", "ios"],
//       default: "android",
//     },

//     currentVersion: {
//       type: String,
//       required: true,
//     },

//     minimumVersion: {
//       type: String,
//       required: true,
//     },

//     playStoreUrl: {
//       type: String,
//       default: "",
//     },

//     appStoreUrl: {
//       type: String,
//       default: "",
//     },

//     updateTitle: {
//       type: String,
//       default: "New Update Available",
//     },

//     updateMessage: {
//       type: String,
//       default:
//         "A new version is available. Please update your app for better experience.",
//     },

//     forceUpdate: {
//       type: Boolean,
//       default: false,
//     },

//     status: {
//       type: Boolean,
//       default: true,
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Admin",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );


// export default mongoose.model(
//   "AppVersion",
//   appVersionSchema
// );


import mongoose from "mongoose";


const PlatformVersionSchema = new mongoose.Schema(
{
    name:{
        type:String,
        enum:[
            "android",
            "ios"
        ],
        required:true
    },


    currentVersion:{
        type:String,
        required:true
    },


    minimumVersion:{
        type:String,
        required:true
    },


    storeUrl:{
        type:String,
        default:""
    },


    forceUpdate:{
        type:Boolean,
        default:false
    },


    status:{
        type:Boolean,
        default:true
    }


},
{
    _id:false
}
);




const AppVersionSchema = new mongoose.Schema(
{

    platforms:{
        type:[PlatformVersionSchema],
        required:true
    },


    updateTitle:{
        type:String,
        default:"New Update Available"
    },


    updateMessage:{
        type:String,
        default:
        "Please update app to continue"
    },


    status:{
        type:Boolean,
        default:true
    },


    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },


    updatedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }


},
{
    timestamps:true
});



// only one active configuration
AppVersionSchema.index(
{
    status:1
}
);


export default mongoose.model(
    "AppVersion",
    AppVersionSchema
);