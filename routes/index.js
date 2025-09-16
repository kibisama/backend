const express = require("express");
const router = express.Router();
const inv = require("./inv");
const cah = require("./cah");
const apps = require("./apps");
const dRx = require("./dRx");

router.use("/inv", inv);
router.use("/cah", cah);
router.use("/apps", apps);
router.use("/dRx", dRx);

module.exports = router;
