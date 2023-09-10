const express = require('express');
const route = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken'); 
let bloodReport_Database = require('./bloodReportSchema.js');
let fracture_Database = require('./fractureSchema.js');
let tumor_Database = require('./TumorSchema.js');
let userProfile_Database = require('./userProfileSchema.js');
let mediLocker_Database = require('./mediLockerSchema.js');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const pythonProcess = require('./pythonController.js');
const authController = require('./authenticationController.js');
const { requireAuth } = require('./authMiddleware.js');

const dotenv = require('dotenv');
dotenv.config({path: 'config.env'});
const port = process.env.PORT;
const ip = process.env.IP;
const gcpProId = process.env.GCP_PROID;
const gcpBucketName = process.env.GCP_BUCKET_NAME;
const secretJwtKey = process.env.SECRET_JWT_KEY;
const gcpJsonKey = process.env.GCP_JSON_KEY;


// Setting up multer and GCP bucket 



// For local upload as well as gcp upload
const multerStorage = multer.diskStorage({
  destination: 'resources/bufferFile',
  filename: (req, file, cb) => {
    const uniqueFilename = Date.now() + '_' + file.originalname;
    // Store the filename in the MongoDB document
    req.filename = uniqueFilename;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage: multerStorage,
});

// For gcp upload only
const upload1 = multer({
  storage:  multer.memoryStorage(),
});




const storage = new Storage({
  projectId: gcpProId, 
  keyFilename: gcpJsonKey, 
});
const bucket = storage.bucket(gcpBucketName);







//*****************************************************Page Render*************************************************
route.get('/',(req,res)=>{
    res.render('home.ejs');
});


route.get('/bloodReport-Analysis',requireAuth,(req,res)=>{
  res.render('manual.ejs');
  });


route.get('/aboutUs', (req,res)=>{
  res.render('aboutUs.ejs');
});


route.get('/mediLocker-add-form', requireAuth, (req,res)=>{
res.render('mediLockerAddForm.ejs');
});





// IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII COLLECTION PAGE IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII


route.get('/mediLocker', requireAuth, async (req,res)=>{
try{

  const jwtToken = req.cookies.jwt;
  let userId;
if (jwtToken) {

  const decodedToken = jwt.verify(jwtToken, secretJwtKey);
  
  
  console.log('Decoded Token inside API: '+decodedToken);
  

   userId = decodedToken.id;
   console.log("user ID ki values: " + userId);
}


const mediLockerImageNames = await mediLocker_Database.find({ UserId:userId });

    
const mediLockerSignedURLs = await Promise.all(
  mediLockerImageNames.map(async (image) => {
    const [signedURL] = await bucket.file(image.Imagename).getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

    return {signedURL, date: Date.now() , ReportName: image.ReportName, uniqueID : image._id};
  })
);


  res.render('mediLockerCollection.ejs', { mediLockerSignedURLs });

}catch (err) {
 
  console.error('Error retrieving images:', err);
  res.status(500).send('Internal Server Error');

}
});



route.get('/user-collection',requireAuth, async (req,res)=>{


  try {
   
    const jwtToken = req.cookies.jwt;
    let userId;
if (jwtToken) {
  
    const decodedToken = jwt.verify(jwtToken, secretJwtKey);
    
    
    console.log('Decoded Token inside API: '+decodedToken);
    
  
     userId = decodedToken.id;
     console.log("user ID ki values: " + userId);
}

console.log("ENTERED");
 const fractureImageNames = await fracture_Database.find({ UserId:userId });
 console.log("Blood File ka naam: ", fractureImageNames);
 console.log("ENTERED");
    
    const fractureSignedURLs = await Promise.all(
      fractureImageNames.map(async (image) => {
        const [signedURL] = await bucket.file(image.Imagename).getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
          });

        return {signedURL, date: image.date, output: image.output, uniqueID : image._id};
      })
    );

// -----------------------------
console.log("ENTERED");
    const bloodReportFileNames = await bloodReport_Database.find({ UserId:userId });
    
    console.log("Blood File ka naam: ", bloodReportFileNames);
    
    
    const bloodReportSignedURLs = await Promise.all(
      bloodReportFileNames.map(async (image) => {
        const [signedURL] = await bucket.file(image.Imagename).getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
          });
         
        return {signedURL, date: image.date, uniqueID : image._id};
      })
    );

// ------------------------------------



const tumorFileNames = await tumor_Database.find({ UserId:userId });

    
const tumorSignedURLs = await Promise.all(
  tumorFileNames.map(async (image) => {
    const [signedURL] = await bucket.file(image.Imagename).getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });
     
    return {signedURL, date: image.date, output: image.output, uniqueID : image._id};
  })
);





res.render('collections.ejs', { fractureSignedURLs , bloodReportSignedURLs, tumorSignedURLs});

  } catch (error) {
    console.error('Error retrieving images:', error);
    res.status(500).send('Internal Server Error');
  }


}) ;













// ******************************************************API***********************************************************
route.post('/api/mediLocker/Upload', upload1.single('file'), async (req, res, next)=>{

  try{
console.log("Entered inside medilocker file ka naam: ", req.file.originalname);
    if (!req.body) {
      res.status(400).send({ message: "Content can not be empty!" });
      console.log("Nothing in body");
      return;
    }

    if (!req.file) {
      const error = new Error('Please choose files');
      console.log("File error no file.")
      error.httpStatusCode = 400;
      return next(error);
    }

    const jwtToken = req.cookies.jwt;
    let userId;
if (jwtToken) {
  
    const decodedToken = jwt.verify(jwtToken, secretJwtKey);
    
    
    console.log('Decoded Token inside API: '+decodedToken);
    
  
     userId = decodedToken.id;
     console.log("user ID ki values: " + userId);
}


    const gcBucketFileName = Date.now() + '_' + req.file.originalname;
    const gcBucketFile = bucket.file(gcBucketFileName);

    console.log("BUCKET WALE FILE KA NAAM :", gcBucketFileName);

    const stream = gcBucketFile.createWriteStream({
  metadata: {
    contentType: req.file.mimetype,
  },
});

stream.on('error', (err) => {
  console.error(err);
  res.status(500).send('Error uploading file.');
});

stream.on('finish', async () => {

   
  const newMediLockerDataToLoad = new mediLocker_Database({
 ReportName:req.body.ReportName,
 Imagename: gcBucketFileName,
 UserId: userId,
});


await newMediLockerDataToLoad.save();
  // let success = {message : 'File successfully uploaded!'};
  //   res.status(201).json({ success });
    res.redirect('/mediLocker')
});

  stream.end(req.file.buffer);
  


  } catch (err){
    res.status(500).send({ message: err.message || "Some error occured while creating a create operation" });
  }
});








route.post('/api/uploadImage',  upload.single('file'), async (req, res, next) => {

  console.log("Inside /api/uploadImage");
    try {
      if (!req.body) {
        res.status(400).send({ message: "Content can not be empty!" });
        return;
      }
  
      if (!req.file) {
        const error = new Error('Please choose files');
        error.httpStatusCode = 400;
        return next(error);
      }


      const jwtToken = req.cookies.jwt;
      let userId;
  if (jwtToken) {
    
      const decodedToken = jwt.verify(jwtToken, secretJwtKey);
      
      
      console.log('Decoded Token inside API: '+decodedToken);
      
    
       userId = decodedToken.id;
       console.log("user ID ki values: " + userId);
  }



     const selectedOption = req.body.option;
    console.log(selectedOption);

 
    // %%%%%%%%%%%%%%%%%%%%% FRACTURE START %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
      if(selectedOption === "Fracture"){

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   
 
  

   
        const newImgToLoad = new fracture_Database({
           date: Date.now(),
            Imagename: req.filename,
            output:"",
            UserId:userId
          });
      
          const data = await newImgToLoad.save();
          console.log("Data Saved in ImageDB: ", data);
      
       


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~    

          const response = await axios.get(`${ip}${port}/fracture-Processing-result/${data._id}`);
          console.log(response.data);
          const updatedData = await fracture_Database.findByIdAndUpdate(data._id, {output: response.data}, {new: true});
          console.log("Data updated!!");

          const finalData = await axios.get(`${ip}${port}/api/fractureImage?id=${data._id}`);
          console.log("Got final data: ", finalData.data.comment);
          let resultImage = 'kuch bhi';
          let resultString = '';
          if(finalData.data.output.includes('No fracture is detected')){
            resultImage = 'images/green-tick.png';
            resultString = "No Fracture Detected";
            console.log("String value: ", resultString);
            console.log("Result Image value: ", resultImage);
            const newupdatedData = await fracture_Database.findByIdAndUpdate(data._id, {output: resultString}, {new: true});
            const userName = await userProfile_Database.findById(data.UserId);
              res.render('resultOutput.ejs',{ name:userName.name,showLink: 0 , resultImage: resultImage, resultString: resultString, portName: port, ipAddress: ip});
          }
          else if(finalData.data.output.includes('Fracture is present')){
            resultImage = 'images/red-tick.png';
            resultString = "Fracture Detected";
            console.log("String value: ", resultString);
            console.log("Result Image value: ", resultImage);
            const newupdatedData = await fracture_Database.findByIdAndUpdate(data._id, {output: resultString}, {new: true});
            const userName = await userProfile_Database.findById(data.UserId);
              res.render('resultOutput.ejs',{ name:userName.name, showLink: 0 ,resultImage: resultImage, resultString: resultString, portName: port, ipAddress: ip});
          }
          else{
            resultImage= 'images/questionMark.jpg';
            resultString = 'Invalid file/image type!';
            console.log("String value: ", resultString);
            console.log("Result Image value: ", resultImage);

            const gcBucketFile = bucket.file(updatedData.Imagename);
            await gcBucketFile.delete();

             console.log(`File ${updatedData.Imagename} deleted Successfully!`);
            const userName = await userProfile_Database.findById(data.UserId);
            const deleteData = await fracture_Database.findByIdAndDelete(data._id);
            res.render('resultOutput.ejs',{ name:userName.name, showLink: 0 , resultImage: resultImage, resultString: resultString, portName: port, ipAddress: ip});
          }
      
        
     
          
       

        }
 // %%%%%%%%%%%%%%%%%%%%% FRACTURE END %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%





 // %%%%%%%%%%%%%%%%%%%%% TUMOR START %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
        else if(selectedOption === "Tumor"){
          console.log("Working before bucket call");
           //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        
     
       
     
       const newImgToLoad = new tumor_Database({
        date: Date.now(),
        Imagename: req.filename,
        output:"",
        UserId:userId
               });
           
               const data = await newImgToLoad.save();
               console.log("Data Saved in ImageDB");
     
     
     //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
     
     
               
               const response = await axios.get(`${ip}${port}/tumor-Processing-result/${data._id}`);
               console.log(response.data);
               
               const updatedData = await tumor_Database.findByIdAndUpdate(data._id, {output: response.data}, {new: true});
               console.log("Data updated!!");
               
             const finalData = await axios.get(`${ip}${port}/api/tumorImage?id=${data._id}`);
     
             console.log("Got final data: ", finalData.data.comment);
               let resultImage = 'kuch nhi';
               let resultString = '';
               if(finalData.data.output.includes('no_tumor')){
                 resultImage = 'images/green-tick.png';
                 resultString = 'No Tumor Detected';
                 console.log("String value: ", resultString);
                 console.log("Result Image value: ", resultImage);
                 const newupdatedData = await tumor_Database.findByIdAndUpdate(data._id, {output: resultString}, {new: true});
                 const userName = await userProfile_Database.findById(data.UserId);
                   res.render('resultOutput.ejs',{ name: userName.name, showLink: 0 ,resultImage: resultImage, resultString: resultString, portName: port, ipAddress: ip});
               }
               else if(finalData.data.output.includes('glioma_tumor')){
                 resultImage = 'images/red-tick.png';
                 resultString = 'Glioma Tumor Detected';
                 console.log("String value: ", resultString);
                 console.log("Result Image value: ", resultImage);
                 const newupdatedData = await tumor_Database.findByIdAndUpdate(data._id, {output: resultString}, {new: true});
                 const userName = await userProfile_Database.findById(data.UserId);
                   res.render('resultOutput.ejs',{ name: userName.name, showLink: 0 ,resultImage: resultImage, resultString: resultString, portName: port, ipAddress: ip});
     
               }

               else if(finalData.data.output.includes('meningioma_tumor')){
                resultImage = 'images/red-tick.png';
                resultString = 'Meningioma Tumor Detected';
                console.log("String value: ", resultString);
                console.log("Result Image value: ", resultImage);
                const newupdatedData = await tumor_Database.findByIdAndUpdate(data._id, {output: resultString}, {new: true});
                const userName = await userProfile_Database.findById(data.UserId);
                  res.render('resultOutput.ejs',{ name: userName.name, showLink: 0 ,resultImage: resultImage, resultString: resultString, portName: port, ipAddress: ip});
    
              }

              else if(finalData.data.output.includes('pituitary_tumor')){
                resultImage = 'images/red-tick.png';
                resultString = 'Pituitary Tumor Detected';
                console.log("String value: ", resultString);
                console.log("Result Image value: ", resultImage);
                const newupdatedData = await tumor_Database.findByIdAndUpdate(data._id, {output: resultString}, {new: true});
                const userName = await userProfile_Database.findById(data.UserId);
                  res.render('resultOutput.ejs',{ name: userName.name,showLink: 0 ,resultImage: resultImage, resultString: resultString, portName: port, ipAddress: ip});
    
              }

               else{
                 resultImage= 'images/questionMark.jpg';
                 resultString = 'Invalid file/image type!';
                 console.log("String value: ", resultString);
                 console.log("Result Image value: ", resultImage);
                 const userName = await userProfile_Database.findById(data.UserId);
                 const gcBucketFile = bucket.file(updatedData.Imagename);
            await gcBucketFile.delete();

             console.log(`File ${updatedData.Imagename} deleted Successfully!`);
                 const deleteData = await tumor_Database.findByIdAndDelete(data._id);
                 res.render('resultOutput.ejs',{ name: userName.name,showLink: 0 , resultImage: resultImage, resultString: resultString, portName: port, ipAddress: ip});
               }
     
              
          
     
             
             }
         
      // %%%%%%%%%%%%%%%%%%%%% TUMOR END %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
 
      

      } catch (err) {
        res.status(500).send({ message: err.message || "Some error occured while creating a create operation" });
      }
    });


route.get('/api/fractureImage', async (req, res) => {
    try {
      if (req.query.id) {
        const id = req.query.id;
        const data = await fracture_Database.findById(id);
        if (!data) {
          res.status(400).send({ message: "Not found user with id " + id });
        } else {
          
          res.send(data);
        }
      } 
      else {
        const info = await fracture_Database.find();
        res.send(info);
      }
    } catch (err) {
      res.status(500).send({ message: err.message || "Error Occured while retrieving User Information" });
    }
  });





route.get('/api/TumorImage', async (req, res) => {
    try {
      if (req.query.id) {
        const id = req.query.id;
        const data = await tumor_Database.findById(id);
        if (!data) {
          res.status(400).send({ message: "Not found user with id " + id });
        } else {
          
          res.send(data);
        }
      } 
      else {
        const info = await tumor_Database.find();
        res.send(info);
      }
    } catch (err) {
      res.status(500).send({ message: err.message || "Error Occured while retrieving User Information" });
    }
  });



//-------------------------------------------Manual Entries -----------------------------------------------------
  route.post('/api/manual/UploadData',async (req,res)=>{
   
  try{
  
    if (!req.body) {
      res.status(400).send({ message: "Content can not be empty!" });
      return;
    }

    const jwtToken = req.cookies.jwt;
    let userId;
if (jwtToken) {
  
    const decodedToken = jwt.verify(jwtToken, secretJwtKey);
    
    
    console.log('Decoded Token inside API: '+decodedToken);
    
  
     userId = decodedToken.id;
     console.log("user ID ki values: " + userId);
}

    
    
    const {bloodReport_hemoglobin , bloodReport_rbc ,bloodReport_hematocrit, bloodReport_wbc, bloodReport_neutrophils, bloodReport_lymphocytes, bloodReport_monocytes, bloodReport_eosinophils, bloodReport_platelet, bloodReport_mcv,bloodReport_mch,bloodReport_mchc} = req.body;
     
    console.log("Test hemoglobin check: ",bloodReport_hemoglobin);

    const Data = await axios.get(`${ip}${port}/bloodReport-manual-Processing-result`, {params:{bloodReport_hemoglobin , bloodReport_rbc ,bloodReport_hematocrit, bloodReport_wbc, bloodReport_neutrophils, bloodReport_lymphocytes, bloodReport_monocytes, bloodReport_eosinophils, bloodReport_platelet, bloodReport_mcv,bloodReport_mch,bloodReport_mchc, userId}});
    console.log("Manual Data mil gaya: ", Data.data);
   
    const pdfName = Data.data.replace(/\s/g, "");

    const userName = await userProfile_Database.findById(userId);

    const options = {
      version: 'v4',
      action: 'read',
      expires: Date.now() + 15 * 60 * 1000, // expire time - 15min
    };

    const [signedUrl] = await bucket.file(pdfName).getSignedUrl(options);
    let link = signedUrl;

  
          let resultImage = 'images/complete.png';
          let resultString = 'Click on below PDF for complete analysis.';
          
    
            res.render('resultOutput.ejs',{ name:userName.name, showLink: 1,pdfLink: link, date:Date.now(),resultImage: resultImage, resultString: resultString, portName: port, ipAddress: ip});
          
      


  }catch (err){
    res.status(500).send({message: err.message || "Error Occured while retrieving User Information"});
  }

  });









  // ************************************* PYTHON PROCESS *******************************************************
   
  
   route.get('/fracture-Processing-result/:id', pythonProcess.fracture_Process);
   route.get('/tumor-Processing-result/:id', pythonProcess.tumor_Process);
   route.get('/bloodReport-manual-Processing-result', pythonProcess.bloodReport_Process_manual);

   
  

//*******************************************AUTHENTICATION*************************************************** */

//rendering signup page
route.get('/signup',authController.signup_get);

// Add to database
route.post('/signup',authController.signup_post);

//Render Login Page
route.get('/login',authController.login_get);

// Add to database
route.post('/login',authController.login_post);

//Logout
route.get('/logout',authController.logout_get);



// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ CRUD ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

route.get("/crud/delete-fracture-collection/:id", async (req, res)=>{
try{

  const id = req.params.id;
  const deleteData = await fracture_Database.findByIdAndDelete(id);

  const gcBucketFile = bucket.file(deleteData.Imagename);
  await gcBucketFile.delete();

          res.redirect("/user-collection");

}catch(err){
  res.status(500).send({message: err.message || "Error Occured while deleting fracture collection"});
}
});


route.get("/crud/delete-bloodReport-collection/:id", async (req, res)=>{
  try{
  
    const id = req.params.id;
    const deleteData = await bloodReport_Database.findByIdAndDelete(id);
       
    const gcBucketFile = bucket.file(deleteData.Imagename);
    await gcBucketFile.delete();

            res.redirect("/user-collection");
  
  }catch(err){
    res.status(500).send({message: err.message || "Error Occured while deleting fracture collection"});
  }
  });


    route.get("/crud/delete-tumor-collection/:id", async (req, res)=>{
      try{
      
        const id = req.params.id;
        const deleteData = await tumor_Database.findByIdAndDelete(id);
           
        const gcBucketFile = bucket.file(deleteData.Imagename);
        await gcBucketFile.delete();

                res.redirect("/user-collection");
      
      }catch(err){
        res.status(500).send({message: err.message || "Error Occured while deleting fracture collection"});
      }
      });
    

      route.get("/crud/delete-mediLocker-data/:id", async (req,res)=>{

        try{
      
          const id = req.params.id;
          const deleteData = await mediLocker_Database.findByIdAndDelete(id);
             
          const gcBucketFile = bucket.file(deleteData.Imagename);
          await gcBucketFile.delete();
  
                  res.redirect("/mediLocker");
        
        }catch(err){
          res.status(500).send({message: err.message || "Error Occured while deleting fracture collection"});
        }

      });





module.exports = route;