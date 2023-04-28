require('dotenv').config();

const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
//const encrypt = require('mongoose-encryption');
//const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const app = express();
//console.log(process.env.SECRET);
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended:true
}));

app.use(session({
    secret : "Our little secrets.",
    resave : false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

mongoose.connect("mongodb://0.0.0.0:27017/userDB",{
    useNewUrlParser : true
});

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);

//const secret = "Thisisoursmallsecrets";
//userSchema.plugin(encrypt,{secret:process.env.SECRET , encryptedFields:["password"]});

const User  = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});
app.get("/secrets",function(req,res){
//    if(req.isAuthenticated()){
//     res.render("secrets");
//    }
//    else{
//     res.redirect("/login");
//    }

User.find({"secret":{$ne:null}}).then(foundUser=>{
    if (foundUser) {
        res.render("secrets",{usersWithSecrets : foundUser});
        
    }
    else{
        console.log("error");
    }
});
});

app.post("/register",function(req,res){

    // bcrypt.hash(req.body.password,saltRounds,function(err,hash){
    //     const newUser = new User({
    //         email : req.body.username,
    //         password : hash
    //     });
    
    //     newUser.save().then(saved=>{
    //         if(saved){
    //             res.render("secrets");
    //         }
    //         else{
    //             console.log("Error in loading the page");
    //         }
    //     })
    // });
    User.register({username : req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets")
            })


        }
    })



    

});
app.post("/login",function(req,res){
    const user =new User({
        username : req.body.username,
        password : req.body.password
        
    });
    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }

    });

    // User.findOne({email : username}).then(foundUser =>{
    //     if(foundUser){
    //         bcrypt.compare(password,foundUser.password,function(err,result){
    //             if(result===true){

    //                 res.render("secrets");
    //             }

    //         });
            
    //     }
    //     else{
    //         console.log("ERROR");
    //     }
    // });
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
       }
       else{
        res.redirect("/login");
       }

});
app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;
    console.log(req.user.id);
    
    User.findById(req.user.id).then(foundUser=>{
        if(foundUser){
            foundUser.secret=submittedSecret;
            foundUser.save().then(save=>{
                if(save){
                    res.redirect("/secrets");
                }
            }); 


        }
        else{
            console.log("error");
        }
    })

});

app.get("/logout",function(req,res){
    req.logout(function(err){
        if (err) {
            console.log(err);
            
        }
        else{
            console.log("successfully logout");
        }
    });
    res.redirect("/");

});

app.listen(3000,function(){
    console.log("Server started at port 3000");
})
