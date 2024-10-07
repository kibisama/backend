const express = require("express");
const router = express.Router();
const scan = require("../controllers/scan");
const search = require("../controllers/getInv");

router.get("/", getInv);
router.post("/scan", scan);

module.exports = router;
