const UserDB = require('./userProfileSchema.js');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({path: 'config.env'});
const secretJwtKey = process.env.SECRET_JWT_KEY;

// handle errors
const handleErrors = (err) =>{
    console.log(err.message, err.code);
    let errors = {email: '', password: ''};



  //incorrect email
  if(err.message === 'incorrect email'){
    errors.email = 'Email is not registered';
  }

   //incorrect password
  if(err.message === 'incorrect password'){
    errors.password = 'Password is incorrect';
  }




   //duplicate error code
   if (err.code === 11000){
    errors.email  = "Email is already registered";
    return errors;
   }


    //validation errors
    if(err.message.includes('userDetails validation failed')){
        Object.values(err.errors).forEach(({properties}) =>{
           errors[properties.path] = properties.message;
        });
    }
    
    return errors;
}

// Tokens
const maxAge = 3 * 24 * 60 * 60;
const createToken = (id) =>{
    return jwt.sign({ id } , secretJwtKey, {
        expiresIn: maxAge
    });
}





module.exports.signup_get = (req,res)=>{
    res.render('signup.ejs');
}

module.exports.login_get = (req,res)=>{
    res.render('login.ejs');
}


module.exports.signup_post = async (req,res)=>{
   

    try{
      
      const name = req.body.name;
      const email = req.body.email;
      const password = req.body.password;
      const dateOfBirth = req.body.dateOfBirth;
      const gender = req.body.gender;

      const newUserCreate = new UserDB({
        name: name, 
        email: email,
        password: password,
        dateOfBirth: dateOfBirth,
        gender: gender,
      });

      const newUser = await newUserCreate.save();

      const token = createToken(newUser._id);
      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000});
      res.status(201).json({newUser: newUser._id});


    }catch(err){
      const errors =  handleErrors(err);
        res.status(400).json({ errors });
    }
    
}



module.exports.login_post = async (req,res)=>{
   const {email, password} = req.body;
   try{
  const newUser = await UserDB.login(email, password);   // so .login is basically a function created by me along with schema program, we can directly use this function for comparison
  const token = createToken(newUser._id);
  res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000});
   res.status(200).json({ newUser: newUser._id});
  

  }catch (err) {
    console.log("What error is : "+err);
    const errors = handleErrors(err);
   res.status(400).json({ errors });
  }
}

module.exports.logout_get  = (req,res)=>{
  res.cookie('jwt', '', { maxAge:1 });
  res.redirect('/');
}