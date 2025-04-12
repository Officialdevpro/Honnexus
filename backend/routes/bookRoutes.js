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

router.get("/get-all", product, bookController.getAll);
router.get("/", product, bookController.getAllBooks);
router.get("/:bookId", bookController.getBook);
router.get("/random", product, bookController.getRandomBooks);
// Add other routes as needed

module.exports = router;
