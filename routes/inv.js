const express = require("express");
const router = express.Router();
const scan = require("../controller/scan");
const search = require("../middlewares/inv/search");

router.get("/", search);
router.post("/scan", scan);

module.exports = router;
