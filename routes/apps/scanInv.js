const express = require("express");
const router = express.Router();
const { post } = require("../../controllers/apps/scanInv");

router.post("/", post);

module.exports = router;
