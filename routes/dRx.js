const express = require("express");
const router = express.Router();
const { getRequiredFields, importCSV } = require("../controllers/dRx");

router.get("/import", getRequiredFields);
router.post("/import", importCSV);

module.exports = router;
