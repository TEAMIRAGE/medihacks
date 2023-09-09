const mongoose = require('mongoose');

const TumorSchema = mongoose.Schema({
    date:{
        type: Date,
        required: true,
       },
   
    output: {
        type:String
    },
    UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'userDetails' 
      },
});

const TumorDB = mongoose.model('TumorCollection', TumorSchema);

module.exports = TumorDB;
