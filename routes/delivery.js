const express = require("express");
const router = express.Router();
const { get } = require("../controllers/delivery");

router.get("/", get);

module.exports = router;
