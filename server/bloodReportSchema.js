const mongoose = require('mongoose');

const bloodReportSchema = mongoose.Schema({
   
    date: {
        type: Date,
        required : true
    }
    ,

    Imagename :{
        type:String,
        required:true
    },
   
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userDetails' 
      },
});

const bloodReportDB = mongoose.model('BloodReportCollection', bloodReportSchema);

module.exports = bloodReportDB;