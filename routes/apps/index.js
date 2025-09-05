const express = require("express");
const router = express.Router();

// use fs and forEach filename to simplify below

const pickup = require("./pickup");
const scanInv = require("./scanInv");

const settings = require("./settings");
const upload = require("./upload");
// const delivery = require("./delivery");

router.use("/pickup", pickup);
router.use("/scanInv", scanInv);

router.use("/settings", settings);
router.use("/upload", upload);
// router.use("/delivery", delivery);

module.exports = router;
