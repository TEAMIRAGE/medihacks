const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const method_Override = require('method-override');
const connectDB = require('./server/connection.js');
const cookieParser = require('cookie-parser');
const { checkUser, requireAuth } = require('./server/authMiddleware.js');


const app = express();

app.use(method_Override('_method'));

app.use(morgan('tiny'));

dotenv.config({path: 'config.env'});
const port = process.env.PORT || 8000;
const ip = process.env.IP;

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());

app.set("view engine", "ejs");

app.use('/css',express.static(path.resolve(__dirname, 'resources/css')));
app.use('/javascript',express.static(path.resolve(__dirname, 'resources/javascript')));
app.use('/images',express.static(path.resolve(__dirname, 'resources/images')));


connectDB();

app.get('*', checkUser);  // Works on all routes

app.get('/predicter-form/:selected',requireAuth,(req,res)=>{
    const selected = req.params.selected;
    res.render('form.ejs',{selected: selected, ipAddress:ip,portName:port});
    });

app.get('/manual',(req,res)=>{
    res.render('manual.ejs');
    });

app.use('/',require('./server/router.js'));

app.listen(port, ()=>{
    console.log(`Server is running on port ${ip}${port}`);
});
