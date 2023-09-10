const mongoose = require('mongoose');

const fractureSchema = mongoose.Schema({
   date:{
    type: Date,
    required: true,
   },
   
    Imagename :{
        type:String,
        required:true
    },
   
    output: {
        type:String
    },
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userDetails' 
      },
});

const fractureDB = mongoose.model('fractureCollection', fractureSchema);

module.exports = fractureDB;