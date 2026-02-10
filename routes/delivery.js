const express = require("express");
const router = express.Router();
const {
  getActiveDeliveryStations,
  getStation,
  getStationInfo,
  getSessions,
  findDeliveries,
  // getReceipt,
  // postLog,
  // scanQR,
  // unsetDeliveryStation,
  // reverseDelivery,
  // search,
} = require("../controllers/delivery");

router.get("/stations", getActiveDeliveryStations);
// router.get("/unset/:rxID", unsetDeliveryStation);
// router.get("/reverse/:rxID", reverseDelivery);
// router.get("/search", search);
router.use("/:invoiceCode", getStation);
router.get("/:invoiceCode", getStationInfo);
// router.post("/:section", postLog);
// router.post("/:section/qr", scanQR);
router.get("/:invoiceCode/:date", getSessions);
router.get("/:invoiceCode/:date/:session", findDeliveries);
// router.get("/:section/:date/:session/receipt", getReceipt);

module.exports = router;
