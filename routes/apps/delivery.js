const express = require("express");
const router = express.Router();
const { get, getAllStations } = require("../../controllers/apps/delivery");

router.get("/", get);
router.get("/stations", getAllStations);

module.exports = router;
