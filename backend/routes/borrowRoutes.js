// routes/borrowRoutes.js
const express = require("express");
const router = express.Router();
const borrowController = require("../controllers/borrowController");
const { product } = require("../controllers/authController");


router
  .route("/")
  .get(borrowController.getBorrowsByStudentId)
  .post(borrowController.borrowBook);

router
  .route("/:id")
  .get(borrowController.getBorrow)
  .patch(borrowController.updateBorrow)
  .delete(borrowController.deleteBorrow);

module.exports = router;
