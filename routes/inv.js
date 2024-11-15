const express = require("express");
const router = express.Router();
const scan = require("../controllers/inventory/scanInv");
const edit = require("../controllers/inventory/editInv");
const getInv = require("../controllers/inventory/getInv");
const getDailyOrder = require("../controllers/inventory/getDailyOrder");

router.get("/", getInv);
router.get("/dailyOrder/:date", getDailyOrder);
router.post("/scan", scan);
router.post("/edit", edit);

module.exports = router;
