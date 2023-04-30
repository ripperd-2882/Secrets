// var md5 = require('md5');
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
// const encrypt = require("mongoose-encryption");
const session = require('express-session')
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;//OAuth 2.0
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//using passport
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize())
app.use(passport.session())

//using passport
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String   //Incase if someone registers with google
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// console.log(process.env.SECRET); 
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());


//OAuth 2.0 Serialization and Deserialization
passport.serializeUser(function (user, done) {
    done(null, user.id);
})

passport.deserializeUser(function (id, done) {
    User.findById(id).then(function (user) {
        done(null, user.id);
    })
        .catch(function (err) {
            console.log(err);;
        })
})

//OAuth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);

        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/", function (req, res) {
    res.render("home");
})

app.get('/auth/google',
    passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect('/secrets');
    });

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    }
    else {
        res.redirect("/login");
    }
})

app.post("/register", function (req, res) {

    //Using bcrypt
    // bcrypt.genSalt(saltRounds, function (err, salt) {
    //     bcrypt.hash(req.body.password, salt, function (err, hash) {
    //         // Store hash in your password DB.
    //         const user = new User({
    //             email: req.body.username,
    //             password: hash
    //             // password: md5(req.body.password)
    //         })

    //         user.save().then(function () {
    //             res.render("secrets");
    //         })
    //             .catch(function (err) {
    //                 res.send(err);
    //             })
    //     });
    // });

    //Using passport
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })

})

app.post("/login", function (req, res) {

    // const username = req.body.username;
    // // const password = md5(req.body.password);
    // const password = req.body.password;

    // User.findOne({ email: username }).then(function (foundUser) {
    //     if (foundUser) {

    //         // Both the below functions work 
    //         // Note:- hash in documentation means the hased password stored in database  

    //         // bcrypt.compare(password, foundUser.password).then(function (result) {
    //         //     if (result == true) {
    //         //         res.render("secrets");
    //         //     }
    //         //     else {
    //         //         res.send("Password is incorrect");
    //         //     }
    //         //     // result == true
    //         // })
    //         //     .catch(function (err) {
    //         //         res.send(err);
    //         //     });

    //         bcrypt.compare(password, foundUser.password, function (err, result) {
    //             if (result === true) {
    //                 console.log(result);
    //                 res.render("secrets");
    //             }
    //             else {
    //                 res.send("Password is incorrect");
    //             }
    //         });
    //         // if (foundUser.password === password) {
    //         //     res.render("secrets");
    //         // }
    //     }
    //     else {
    //         res.send("User not found");
    //     }
    // })
    //     .catch(function (err) {
    //         res.send(err);
    //     })

    //Using passport
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }
    })
})

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
})


app.listen(3000, function () {
    console.log("Server has started");
})