const express = require("express");
const router = express.Router();
const upsertItems = require("../controllers/cah/upsertItems");

router.post("/upsertItems", upsertItems);

module.exports = router;
