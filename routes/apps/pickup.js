const express = require("express");
const router = express.Router();
const { post, search, png } = require("../../controllers/apps/pickup");

router.post("/", post);
router.get("/search", search);
router.get("/png/:_id", png);
// router.post("/proof", proof);

module.exports = router;
