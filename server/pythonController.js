const {spawn} = require('child_process');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({path: 'config.env'});
const port = process.env.PORT;
const ip = process.env.IP;



module.exports.fracture_Process = async (req, res) => {
    try {
      const id = req.params.id;
      let imgPath;
      const data = await axios.get(`${ip}${port}/api/fractureImage?id=${id}`);
      console.log(data.data.Imagename);
      imgPath = `${data.data.Imagename}`;  // File name
  
      const pythonScriptPath ='FracDetec/fractdetec.py';

      const pythonProcess = spawn('python3', [pythonScriptPath, imgPath]);
  
      let output = '';
  
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
  
      pythonProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });
  
      pythonProcess.on('close', async (code) => {
        console.log(`Python script exited with code ${code}`);
  
        res.send(output);
      });
    } catch (err) {
      console.log(err);
    }
  }



  module.exports.tumor_Process = async (req, res) => {
    try {
      const id = req.params.id;
      let imgPath;
      const data = await axios.get(`${ip}${port}/api/tumorImage?id=${id}`);
      console.log(data.data.Imagename);
      imgPath = `${data.data.Imagename}`;  // File name
  
      const pythonScriptPath ='TumorDetec/brain_tumor.py';

      const pythonProcess = spawn('python3', [pythonScriptPath, imgPath]);
  
      let output = '';
  
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
  
      pythonProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });
  
      pythonProcess.on('close', async (code) => {
        console.log(`Python script exited with code ${code}`);
  
        res.send(output);
      });
    } catch (err) {
      console.log(err);
    }
  }




  module.exports.bloodReport_Process_manual = async (req, res) => {
    try {
    
      const {bloodReport_hemoglobin , bloodReport_rbc ,bloodReport_hematocrit, bloodReport_wbc, bloodReport_neutrophils, bloodReport_lymphocytes, bloodReport_monocytes, bloodReport_eosinophils, bloodReport_platelet, bloodReport_mcv,bloodReport_mch,bloodReport_mchc, userId} = req.query;

   
      const pythonScriptPath = 'BloodReport/bloodreport.py';
      const pythonProcess = spawn('python3', [pythonScriptPath, bloodReport_wbc, bloodReport_rbc ,bloodReport_hemoglobin , bloodReport_hematocrit,  bloodReport_mcv, bloodReport_mch, bloodReport_mchc ,bloodReport_platelet ,bloodReport_neutrophils, bloodReport_lymphocytes, bloodReport_monocytes, bloodReport_eosinophils, userId ]);
  
      let output = '';
  
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
  
      pythonProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });
  
      pythonProcess.on('close', async (code) => {
        console.log(`Python script exited with code ${code}`);
  
        res.send(output);
      });
    } catch (err) {
      console.log(err);
    }
  }





