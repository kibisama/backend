const express = require("express");
const router = express.Router();
const scan = require("../controllers/scanInv");
const edit = require("../controllers/editInv");
const getInv = require("../controllers/getInv");

router.get("/", getInv);
router.post("/scan", scan);
router.post("/edit", edit);

module.exports = router;
