const express = require("express");
const router = express.Router();
const { mailer } = require("../../controllers/apps/delivery");

router.get("/", mailer);

module.exports = router;
