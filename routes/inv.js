const express = require("express");
const router = express.Router();
const scan = require("../controllers/inv/scan");

router.post("/scan", scan);

module.exports = router;
