const express = require("express");
const router = express.Router();
const scan = require("../controllers/inv/scan");
const getDailyOrder = require("../controllers/inv/getDailyOrder");

router.post("/scan", scan);
router.get("/dailyOrder/:date", getDailyOrder);

module.exports = router;
