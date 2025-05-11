const express = require("express");
const router = express.Router();
const bookNotificationController = require("../controllers/notifyController");
const { product } = require("../controllers/authController");

router.post("/",product, bookNotificationController.subscribeToBookNotification);

module.exports = router;
