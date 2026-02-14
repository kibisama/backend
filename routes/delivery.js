const express = require("express");
const router = express.Router();
const {
  getActiveDeliveryStations,
  getStation,
  getStationInfo,
  getSessions,
  findDeliveries,
  // getReceipt,
  postLog,
  scanQR,
  unsetDeliveryStation,
  returnDelivery,
  search,
} = require("../controllers/delivery");

router.get("/stations", getActiveDeliveryStations);
router.get("/unset/:rxID", unsetDeliveryStation);
router.get("/return/:rxID", returnDelivery);
router.get("/search", search);
router.use("/:invoiceCode", getStation);
router.get("/:invoiceCode", getStationInfo);
router.post("/:invoiceCode", postLog);
router.post("/:invoiceCode/qr", scanQR);
router.get("/:invoiceCode/:date", getSessions);
router.get("/:invoiceCode/:date/:session", findDeliveries);
// router.get("/:section/:date/:session/receipt", getReceipt);

module.exports = router;
