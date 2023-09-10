const express = require('express');
const route = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken'); 
let bloodReport_Database = require('./bloodReportSchema.js');
let fracture_Database = require('./fractureSchema.js');
let tumor_Database = require('./TumorSchema.js');
let userProfile_Database = require('./userProfileSchema.js');
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

const globalTimestamp = Date.now();

const multerStorage = multer.diskStorage({
  destination: 'resources/bufferFile',
  filename: (req,file,cb) =>{
    const uniqueFilename = globalTimestamp + '_' + req.file.originalname;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage: multerStorage, 
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
})




// IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII COLLECTION PAGE IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII




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

 const fractureImageNames = await fracture_Database.find({ UserId:userId });

    
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

    const bloodReportFileNames = await bloodReport_Database.find({ UserId:userId });
    
    
    
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
