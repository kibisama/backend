const express = require("express");
const router = express.Router();
const { checkDRxCSV } = require("../../controllers/apps/upload");

router.post("/checkDRxCSV", checkDRxCSV);

module.exports = router;
