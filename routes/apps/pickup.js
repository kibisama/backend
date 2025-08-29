const express = require("express");
const router = express.Router();
const { post, search, png, report } = require("../../controllers/apps/pickup");

router.post("/", post);
router.get("/search", search);
router.get("/png/:_id", png);
router.get("/report/:_id/:rxNumber", report);

module.exports = router;
