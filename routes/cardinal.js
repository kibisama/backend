const express = require("express");
const router = express.Router();
const getInvoice = require("../controllers/cardinal/getInvoice");
const checkInventory = require("../controllers/cardinal/checkInventory");

module.exports = router;

router.get("/invoice/:date", getInvoice);
router.post("/invoice/:date", checkInventory);
