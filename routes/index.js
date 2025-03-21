const express = require("express");
const router = express.Router();
const inv = require("./inv");

router.use("/inv", inv);

module.exports = router;
