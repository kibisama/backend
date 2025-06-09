const express = require("express");
const router = express.Router();
const pickup = require("./pickup");

router.use("/pickup", pickup);

module.exports = router;
