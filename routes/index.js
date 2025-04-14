const express = require("express");
const router = express.Router();
const inv = require("./inv");
const cah = require("./cah");

router.use("/inv", inv);
router.use("/cah", cah);

module.exports = router;
