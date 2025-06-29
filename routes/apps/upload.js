const express = require("express");
const router = express.Router();
const { checkDRxCSV, uploadDRxCSV } = require("../../controllers/apps/upload");

router.post("/checkDRxCSV", checkDRxCSV);
router.post("/uploadDRxCSV", uploadDRxCSV);

module.exports = router;
