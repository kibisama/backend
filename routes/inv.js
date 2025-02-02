const express = require("express");
const router = express.Router();
const scan = require("../controllers/inventory/scan");
const getDailyOrder = require("../controllers/inventory/getDailyOrder");

router.post("/scan", scan);
router.get("/dailyOrder/:date", getDailyOrder);

module.exports = router;
