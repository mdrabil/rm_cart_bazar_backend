import MaintenanceModel from "../models/Maintenance.model.js";

export const saveMaintenance = async(req,res)=>{

try{


const { startDate, endDate}=req.body;



const today =new Date();today.setHours( 0,0, 0,0);



// Start date validation
if(startDate)
{

const start =new Date(startDate);
start.setHours(0,0,0,0);
if(start < today)
{

return res.status(400).json({

success:false,

message:
"Start date cannot be before today"

});

}

}



// End date validation
if(endDate)
{

const end =new Date(endDate);
end.setHours(0, 0, 0, 0);



if(end < today)
{

return res.status(400).json({

success:false,

message:
"End date cannot be before today"

});

}


}

let imageData = null;


if(req.file)
{

imageData = {

url:req.file.path,

public_id:req.file.filename

};

}



// Start and End comparison

if(startDate && endDate)
{


const start =new Date(startDate);


const end =new Date(endDate);



if(end < start)
{

return res.status(400).json({

success:false,

message:
"End date cannot be before start date"

});

}

}





let data =await MaintenanceModel.findOne();



if(data)
{


data.appMaintenance =req.body.appMaintenance;
data.webMaintenance =req.body.webMaintenance;
data.title =req.body.title;
data.message =req.body.message;
data.image =req.body.image || data.image;
data.startDate =startDate || data.startDate;
data.endDate =endDate || data.endDate;
data.updatedBy =req.user._id;
await data.save();

return res.json({
success:true,
message:
"Maintenance updated successfully",
data
});}




data =await MaintenanceModel.create({

...req.body,

createdBy:req.user._id

});

return res.json({
success:true,
message:
"Maintenance created successfully",
data
});
}
catch(error){


return res.status(500).json({
success:false,
message:error.message
});
}
};

export const checkMaintenance = async(req,res)=>{

try{


const data = await MaintenanceModel.findOne({status:true});



if(!data){
return res.json({
success:true,
maintenance:false
});

}
// Date based auto check

const today = new Date();today.setHours(0,0,0,0);

if(data.startDate && new Date(data.startDate) > today)
{

return res.json({
success:true,
maintenance:false
});
}



if(data.endDate && new Date(data.endDate) < today)
{
return res.json({

success:true,
maintenance:false

});

}



const appMaintenance = Boolean(data.appMaintenance);
const webMaintenance = Boolean(data.webMaintenance);

const maintenance = appMaintenance || webMaintenance;

return res.json({
  success: true,
  maintenance,
  appMaintenance,
  webMaintenance,
  title: data.title,
  message: data.message,
  image: data.image,
  startDate: data.startDate,
  endDate: data.endDate,
});
}
catch(error)
{

return res.status(500).json({

success:false,

message:error.message

});

}

};