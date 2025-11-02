const express = require("express");
const router = express.Router();
const {
  getRequiredFields,
  importCSV,
  getPatients,
} = require("../controllers/dRx");

router.get("/pt", getPatients);
router.get("/import", getRequiredFields);
router.post("/import", importCSV);

module.exports = router;
