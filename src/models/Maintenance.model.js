import mongoose from "mongoose";


const MaintenanceSchema = new mongoose.Schema(
{

    appMaintenance:{
        type:Boolean,
        default:false
    },


    webMaintenance:{
        type:Boolean,
        default:false
    },


    title:{
        type:String,
        default:"Under Maintenance"
    },


    message:{
        type:String,
        default:
        "We are working on improvements. Please try again later."
    },

    startDate:{
    type:Date,
    default:null
},


endDate:{
    type:Date,
    default:null
},

   image:{
    public_id:{
        type:String,
        default:""
    },

    url:{
        type:String,
        default:""
    }
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


MaintenanceSchema.index({
    status:1
});


export default mongoose.model(
"Maintenance",
MaintenanceSchema
);