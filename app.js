var md5 = require('md5');
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// console.log(process.env.SECRET); 
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    res.render("home");
})

app.get("/login", function (req, res) {
    res.render("login");
})

app.get("/register", function (req, res) {
    res.render("register");
})


app.post("/register", function (req, res) {
    const user = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })

    user.save().then(function () {
        res.render("secrets");
    })
        .catch(function (err) {
            res.send(err);
        })
})

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({ email: username }).then(function (foundUser) {
        if (foundUser) {
            if (foundUser.password === password) {
                res.render("secrets");
            }
            else {
                res.send("Password is incorrect");
            }
        }
        else {
            res.send("User not found");
        }
    })
        .catch(function (err) {
            res.send(err);
        })
})


app.listen(3000, function () {
    console.log("Server has started");
})