const express = require("express");
const router = express.Router();
const scan = require("../controllers/scan");
const search = require("../controllers/scan");

router.get("/", search);
router.post("/scan", scan);

module.exports = router;
