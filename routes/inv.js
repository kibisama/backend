const express = require("express");
const router = express.Router();
const getDailyOrder = require("../controllers/inv/getDailyOrder");

router.get("/dailyOrder/:date", getDailyOrder);

module.exports = router;
