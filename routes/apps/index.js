const express = require("express");
const router = express.Router();

// use fs and forEach filename to simplify below

const pickup = require("./pickup");
const settings = require("./settings");
const upload = require("./upload");
const delivery = require("./delivery");

router.use("/pickup", pickup);
router.use("/settings", settings);
router.use("/upload", upload);
router.use("/delivery", delivery);

module.exports = router;
