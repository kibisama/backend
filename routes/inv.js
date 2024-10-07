const express = require("express");
const router = express.Router();
const scan = require("../controllers/scan");
const search = require("../controllers/search");

router.get("/", search);
router.post("/scan", scan);

module.exports = router;
