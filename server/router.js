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
