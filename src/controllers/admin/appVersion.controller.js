
// // ADMIN CREATE / UPDATE VERSION

// import AppVersionModel from "../../models/AppVersion.model.js";



// export const updateAppVersion = async (req,res)=>{

//     try{

//         const {
//             platform,
//             currentVersion,
//             minimumVersion,
//             playStoreUrl,
//             appStoreUrl,
//             updateTitle,
//             updateMessage,
//             forceUpdate
//         } = req.body;


//         let version = await AppVersionModel.findOne({
//             platform
//         });


//         if(version){

//             version.currentVersion = currentVersion;
//             version.minimumVersion = minimumVersion;
//             version.playStoreUrl = playStoreUrl;
//             version.appStoreUrl = appStoreUrl;
//             version.updateTitle = updateTitle;
//             version.updateMessage = updateMessage;
//             version.forceUpdate = forceUpdate;

//             await version.save();

//         }
//         else{

//             version = await AppVersionModel.create({
//                 platform,
//                 currentVersion,
//                 minimumVersion,
//                 playStoreUrl,
//                 appStoreUrl,
//                 updateTitle,
//                 updateMessage,
//                 forceUpdate,
//                 createdBy:req.user?._id
//             });

//         }


//         res.status(200).json({
//             success:true,
//             message:"App version updated successfully",
//             data:version
//         });


//     }catch(error){

//         res.status(500).json({
//             success:false,
//             message:error.message
//         });

//     }

// };



// // APP CHECK VERSION API

// export const checkAppVersion = async(req,res)=>{

//     try{

//         const {
//             platform,
//             version
//         } = req.query;


//         const latest = await AppVersionModel.findOne({
//             platform,
//             status:true
//         });


//         if(!latest){

//             return res.json({
//                 success:true,
//                 updateAvailable:false
//             });

//         }


//         const current = version.split(".").map(Number);

//         const latestVersion =
//         latest.currentVersion.split(".").map(Number);



//         let updateAvailable=false;


//         for(let i=0;i<3;i++){

//             if(latestVersion[i] > current[i]){

//                 updateAvailable=true;
//                 break;

//             }

//             if(latestVersion[i] < current[i]){
//                 break;
//             }

//         }



//         res.json({

//             success:true,

//             updateAvailable,

//             forceUpdate:
//             latest.forceUpdate,

//             latestVersion:
//             latest.currentVersion,

//             title:
//             latest.updateTitle,

//             message:
//             latest.updateMessage,

//             playStoreUrl:
//             latest.playStoreUrl

//         });


//     }catch(error){

//         res.status(500).json({
//             success:false,
//             message:error.message
//         });

//     }

// };


import AppVersionModel from "../../models/AppVersion.model.js";



/*
====================================================
ADMIN UPDATE APP VERSION
====================================================
*/

export const updateAppVersion = async(req,res)=>{


try{


const {

platforms,

updateTitle,

updateMessage,

status


}=req.body;



if(!platforms || !Array.isArray(platforms))
{

return res.status(400).json({

success:false,

message:
"Platforms array required"

});

}




let appVersion =
await AppVersionModel.findOne();



if(appVersion)
{


appVersion.platforms = platforms;

appVersion.updateTitle =
updateTitle || appVersion.updateTitle;


appVersion.updateMessage =
updateMessage || appVersion.updateMessage;


appVersion.status =
status ?? appVersion.status;


appVersion.updatedBy =
req.user?._id;



await appVersion.save();



}
else
{


appVersion =
await AppVersionModel.create({

platforms,

updateTitle,

updateMessage,

status,

createdBy:req.user?._id

});


}



return res.status(200).json({

success:true,

message:
"App version updated successfully",

data:appVersion


});



}
catch(error){


return res.status(500).json({

success:false,

message:error.message

});


}


};







/*
====================================================
MOBILE CHECK VERSION
====================================================
*/

export const checkAppVersion = async(req,res)=>{


try{


const {

platform,

version


}=req.query;



if(
!platform ||
!version
)
{

return res.status(400).json({

success:false,

message:
"Platform and version required"

});

}




const appVersion =
await AppVersionModel.findOne({

status:true

});



if(!appVersion)
{

return res.json({

success:true,

updateAvailable:false

});


}




const platformData =
appVersion.platforms.find(
(item)=>
item.name === platform
);



if(!platformData)
{

return res.json({

success:true,

updateAvailable:false

});

}



const current =
version
.split(".")
.map(Number);



const latest =
platformData.currentVersion
.split(".")
.map(Number);



let updateAvailable=false;



for(
let i=0;
i<3;
i++
)
{


if(
latest[i] > current[i]
)
{

updateAvailable=true;
break;

}



if(
latest[i] < current[i]
)
{

break;

}


}




return res.json({

success:true,


updateAvailable,


forceUpdate:
platformData.forceUpdate,


latestVersion:
platformData.currentVersion,


minimumVersion:
platformData.minimumVersion,


title:
appVersion.updateTitle,


message:
appVersion.updateMessage,


storeUrl:
platformData.storeUrl


});



}
catch(error){


return res.status(500).json({

success:false,

message:error.message

});


}


};