const express = require("express");
const router = express.Router();

// use fs and forEach filename to simplify below

const pickup = require("./pickup");
const scanInv = require("./scanInv");
// const upload = require("./upload");
// const delivery = require("./delivery");
const settings = require("./settings");

router.use("/pickup", pickup);
router.use("/scanInv", scanInv);
// router.use("/upload", upload);
// router.use("/delivery", delivery);
router.use("/settings", settings);

module.exports = router;
