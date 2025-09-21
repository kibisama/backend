const express = require("express");
const router = express.Router();
const {
  get,
  getStationId,
  getSessions,
  getLogs,
  postLog,
} = require("../controllers/delivery");
const dlvry = require("../services/apps/delivery");

router.get("/", get);
router.use("/:section", getStationId);
// router.post("/:section", postLog);
router.get("/:section/:date", getSessions);
// router.get("/:section/:date/:session", getLogs);

module.exports = router;
