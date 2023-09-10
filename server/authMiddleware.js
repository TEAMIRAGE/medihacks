const jwt = require('jsonwebtoken'); 
const UserDB = require('./userProfileSchema.js');
const dotenv = require('dotenv');
dotenv.config({path: 'config.env'});
const secretJwtKey = process.env.SECRET_JWT_KEY;


const requireAuth = (req,res,next)=>{
const token = req.cookies.jwt;

// check json web tokens exists & is verified   
if(token){
jwt.verify(token, secretJwtKey, (err, decodedToken)=>{
if(err){
    console.log(err.message);
    res.redirect('/login');
} else{
    console.log("Token Value: "+decodedToken);
    next();
}
})
}
else{


    
    res.redirect('/login');
}
}

// check current user
const checkUser = (req,res,next)=>{
    const token =req.cookies.jwt;
    console.log("Token value is: "+token);
    if(token){
        jwt.verify(token,secretJwtKey,async (err, decodedToken)=>{
            if(err){
                console.log(err.message);
                res.locals.user = null;
                next();
            } else{
                console.log("Decoded Token ki values: "+decodedToken);
                let user = await UserDB.findById(decodedToken.id);
                res.locals.user = user;
                next();
            }
            })
    }
    else{
res.locals.user = null;
next();
    }
}



module.exports = { requireAuth , checkUser};