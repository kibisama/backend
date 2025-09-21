const express = require("express");
const router = express.Router();
const { getRequiredFields, importCSV, scanQR } = require("../controllers/dRx");

// router.post("/qr", scanQR);
router.get("/import", getRequiredFields);
router.post("/import", importCSV);

module.exports = router;
