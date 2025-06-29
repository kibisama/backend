const express = require("express");
const router = express.Router();
const pickup = require("./pickup");
const settings = require("./settings");
const upload = require("./upload");

router.use("/pickup", pickup);
router.use("/settings", settings);
router.use("/upload", upload);

module.exports = router;
