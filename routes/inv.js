const express = require("express");
const router = express.Router();
const scan = require("../controllers/inventory/scanInv");
const edit = require("../controllers/inventory/editInv");
const getInv = require("../controllers/inventory/getInv");

router.get("/", getInv);
router.post("/scan", scan);
router.post("/edit", edit);

module.exports = router;
