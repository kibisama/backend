const express = require("express");
const router = express.Router();
const {
  getActiveDeliveryStations,
  getAllDeliveryStations,
  getStation,
  postStation,
  getStationInfo,
  getSessions,
  findDeliveries,
  getReceipt,
  postLog,
  putStation,
  scanQR,
  unsetDeliveryStation,
  returnDelivery,
  search,
} = require("../controllers/delivery");

router.post("/station", postStation);
router.get("/stations", getActiveDeliveryStations);
router.get("/stations/all", getAllDeliveryStations);
router.get("/unset/:rxID", unsetDeliveryStation);
router.get("/return/:rxID", returnDelivery);
router.get("/search", search);
router.use("/:invoiceCode", getStation);
router.get("/:invoiceCode", getStationInfo);
router.put("/:invoiceCode", putStation);
router.post("/:invoiceCode", postLog);
router.post("/:invoiceCode/qr", scanQR);
router.get("/:invoiceCode/:date", getSessions);
router.get("/:invoiceCode/:date/:session", findDeliveries);
router.get("/:section/:date/:session/receipt", getReceipt);

module.exports = router;
