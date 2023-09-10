const { isEmail } = require('validator');
const bcrypt = require('bcrypt')
const mongoose = require('mongoose'); 

const userSchema = new mongoose.Schema({
    name: {
type: String,
required: [true, "Please enter a name"]
    },
    email: {
        type : String,
        required: [true, "Please enter a email"],
        unique : true,
        lowercase: true,
        validate: [isEmail, "Please enter a valid email"]
    },
    password: {
        type: String, 
        required: [true, 'Please enter a password'],
        minlength: [6,'Minimum password length is 6 characters']
    },
    gender: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    }
}); 

/* (Mongoose Hooks) */
// fire a function after doc saved to db 
userSchema.post('save', function (doc, next){
    console.log('new user was created & saved', doc);
    next();
});

//fire a function before doc saved to db
userSchema.pre('save', async function (next){
   const salt  = await bcrypt.genSalt();
   this.password = await bcrypt.hash(this.password, salt);
    next();
});


// static method to login user
userSchema.statics.login = async function(email, password){    //we can use this .login function that we created in login route directly for password and email comparison
    
    const user = await this.findOne({ email });
    if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
        return user;
    }
    throw Error('incorrect password');
    }
    throw Error('incorrect email');
}



const User = mongoose.model('userDetails', userSchema);

module.exports = User;