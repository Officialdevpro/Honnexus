// routes/borrowRoutes.js
const express = require("express");
const router = express.Router();
const borrowController = require("../controllers/borrowController");
const { product, restrictTo } = require("../controllers/authController");

router
  .route("/")
  .get(product, borrowController.getBorrowsByStudentId)
  .post(product, restrictTo("admin"), borrowController.borrowBook);

router
  .route("/return")
  .post(product, restrictTo("admin"), borrowController.returnBorrow);
router
  .route("/:id")
  .get(borrowController.getBorrow)
  .patch(borrowController.updateBorrow)
  .delete(borrowController.deleteBorrow);

module.exports = router;
