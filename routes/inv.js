const express = require("express");
const router = express.Router();
const inventory = require("../controllers/inventory");

router.get("/", inventory.getInventories);
router.get("/alt", inventory.getAlternatives);
router.get("/usage/:date", inventory.getUsages);

module.exports = router;
