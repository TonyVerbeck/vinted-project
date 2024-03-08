const express = require("express");
const cloudinary = require("cloudinary").v2;
const fileUpload = require("express-fileupload");
const router = express.Router();
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      const { title, description, price, condition, city, brand, size, color } =
        req.body;

      const maxTitleChar = 50;
      const maxDescriptionChar = 500;
      const maxPrice = 100000;

      if (title.length > maxTitleChar) {
        return res.status(400).json({
          message: `Le titre ne peut pas dépasser ${maxTItleChar} caractères.`,
        });
      }
      if (description.length > maxDescriptionChar) {
        return res.status(400).json({
          message: `La description ne peut pas dépasser ${maxDescriptionChar} caractères.`,
        });
      }
      if (price > maxPrice) {
        return res.status(400).json({
          message: `Le prix ne peut pas dépasser ${maxPrice}.`,
        });
      }

      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          {
            MARQUE: brand,
          },
          {
            TAILLE: size,
          },
          {
            ÉTAT: condition,
          },
          {
            COULEUR: color,
          },
          {
            EMPLACEMENT: city,
          },
        ],

        owner: req.user,
      });
      console.log(newOffer);
      const cloudinaryResponse = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture)
      );
      newOffer.product_image = cloudinaryResponse;
      await newOffer.save();
      await newOffer.populate("owner", "account");
      res.json(newOffer);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.put("/offer/:id", isAuthenticated, async (req, res) => {
  try {
    const updateOffer = await Offer.findById(req.params.id);

    updateOffer = {
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        {
          MARQUE: brand,
        },
        {
          TAILLE: size,
        },
        {
          ÉTAT: condition,
        },
        {
          COULEUR: color,
        },
        {
          EMPLACEMENT: city,
        },
      ],
      owner: req.user,
    };

    if (!updateOffer) {
      return res.status(404).json({ message: "Annonce non trouvée" });
    } else {
      res.json({ message: "Annonce modifiée" });
    }
    await updateOffer.save();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/offer/:id/delete", isAuthenticated, async (req, res) => {
  try {
    const deletedOffer = await Offer.findByIdAndDelete(req.params.id);

    if (!deletedOffer) {
      return res.status(404).json({ message: "Annonce non trouvée" });
    } else {
      res.json({ message: "Annonce supprimée" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const { title, priceMax, priceMin, page, sort } = req.query;
    const filters = {};

    if (title) {
      filters.product_name = new RegExp(title, "i");
    }
    if (priceMin) {
      filters.product_price = { $gte: priceMin };
    }
    if (priceMax) {
      if (priceMin) {
        filters.product_price.$lte = priceMax;
      } else {
        filters.product_price = { $lte: priceMax };
      }
    }

    const sortfilter = {};

    if (sort === "price-asc") {
      sortfilter.product_price = "asc";
    } else if (sort === "price-desc") {
      sortfilter.product_price = "desc";
    }

    let skip = 0;

    if (page) {
      skip = (page - 1) * 5;
    }
    const offers = await Offer.find(filters)
      .sort(sortfilter)
      .skip(skip)
      .limit(5)
      .populate("owner", "account");

    const count = await Offer.countDocuments(filters);
    res.json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Offer.findById(id).populate("owner", "account");
    res.json(offer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
