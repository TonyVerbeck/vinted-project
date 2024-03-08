const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const app = express();

app.use(express.json());

mongoose.connect("mongodb://127.0.0.1/vinted");

cloudinary.config({
  cloud_name: "drflmvzv0",
  api_key: "352648376338464",
  api_secret: "aTV6bB-Si1tgvPnUJUQcrB3lxjU",
});

const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(3000, () => {
  console.log("Server started 🚀");
});
