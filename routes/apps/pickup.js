const express = require("express");
const router = express.Router();
const {
  get,
  add,
  remove,
  getCanvas,
} = require("../../controllers/apps/pickup");

router.get("/", get);
router.post("/remove", remove);
router.post("/add", add);
router.get("/canvas", getCanvas);

module.exports = router;
