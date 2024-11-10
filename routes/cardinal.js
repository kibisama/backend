const express = require("express");
const router = express.Router();
const getInvoice = require("../controllers/cardinal/getInvoice");
const checkInventory = require("../controllers/cardinal/checkInventory");
const findInvoice = require("../controllers/cardinal/findInvoice");

module.exports = router;

router.get("/invoice/:date", getInvoice);
router.post("/invoice/find/:date", findInvoice, getInvoice);
router.get("/invoice/review/:date", checkInventory);
