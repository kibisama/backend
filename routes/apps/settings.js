const express = require("express");
const router = express.Router();
const { get, post } = require("../../controllers/apps/settings");

router.get("/", get);
router.post("/", post);

module.exports = router;
