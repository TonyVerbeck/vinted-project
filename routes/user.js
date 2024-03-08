const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const encBase64 = require("crypto-js/enc-base64");
const SHA256 = require("crypto-js/sha256");
const isAuthenticated = require("../middlewares/isAuthenticated");
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User");

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const salt = uid2(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid2(64);

    const existingMail = await User.findOne({ email: req.body.email });
    if (existingMail) {
      return res.status(200).json({ message: "Email already exists" });
    }
    if (!req.body.username) {
      return res.status(200).json({ message: "Username missing" });
    }

    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
        avatar: cloudinaryResponse,
      },
      newsletter: req.body.newsletter,
      token,
      hash,
      salt,
    });
    const cloudinaryResponse = await cloudinary.uploader.upload(
      convertToBase64(req.files.picture)
    );

    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const login = await User.findOne({ email: req.body.email });
    if (!login) {
      return res.status(401).json({ message: "Email or password incorrect" });
    }

    const newHash = SHA256(req.body.password + login.salt).toString(encBase64);

    if (newHash === login.hash) {
      res.status(200).json({
        _id: login._id,
        token: login.token,
        account: {
          username: login.account.username,
        },
      });
    } else {
      return res.status(401).json({ message: "Email or password incorrect" });
    }

    await login.save();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
