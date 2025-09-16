const express = require("express");
const router = express.Router();

const pickup = require("./pickup");
const scanInv = require("./scanInv");
const settings = require("./settings");

router.use("/pickup", pickup);
router.use("/scanInv", scanInv);
router.use("/settings", settings);

module.exports = router;
