const express = require("express");
const router = express.Router();
const inventory = require("../controllers/inventory");

router.get("/", inventory.getInventories);
router.get("/alt", inventory.getAlternatives);

module.exports = router;
