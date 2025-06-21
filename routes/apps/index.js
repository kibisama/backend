const express = require("express");
const router = express.Router();
const pickup = require("./pickup");
const settings = require("./settings");

router.use("/pickup", pickup);
router.use("/settings", settings);

module.exports = router;
