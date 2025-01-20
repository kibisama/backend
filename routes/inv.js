const express = require("express");
const router = express.Router();
const scan = require("../controllers/inventory/scanInv");

router.post("/scan", scan);

module.exports = router;
