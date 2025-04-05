const express = require("express");
const bookController = require("../controllers/bookController");
const upload = require("../utils/multer");

const router = express.Router();

router.post(
  "/",
  upload.single("icon"), // 👈 Accept 'icon' image
  bookController.createBook
);

router.get("/", bookController.getAllBooks);
// Add other routes as needed

module.exports = router;
