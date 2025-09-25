const express = require("express");
const router = express.Router();
const {
  get,
  getStation,
  getStationInfo,
  getSessions,
  getLogItems,
  postLog,
  scanQR,
  unsetDeliveryStation,
} = require("../controllers/delivery");

router.get("/", get);
router.get("/unset/:rxID", unsetDeliveryStation);
router.use("/:section", getStation);
router.get("/:section", getStationInfo);
router.post("/:section", postLog);
router.post("/:section/qr", scanQR);
router.get("/:section/:date", getSessions);
router.get("/:section/:date/:session", getLogItems);

module.exports = router;
