const express = require("express");
const bookController = require("../controllers/bookController");
const upload = require("../utils/multer");
const { product } = require("../controllers/authController");
const router = express.Router();

router.post(
  "/",
  product,
  upload.single("icon"), // 👈 Accept 'icon' image
  bookController.createBook
);

router.get("/", product, bookController.getAllBooks);
// Add other routes as needed

module.exports = router;
