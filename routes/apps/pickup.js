const express = require("express");
const router = express.Router();
const {
  clear,
  get,
  add,
  remove,
  getCanvas,
  clearCanvas,
  getRelation,
  selectRelation,
  submit,
} = require("../../controllers/apps/pickup");

router.get("/", get);
router.post("/remove", remove);
router.post("/add", add);
router.get("/canvas", getCanvas);
router.get("/clear-canvas", clearCanvas);
router.get("/clear", clear);
router.get("/relation", getRelation);
router.post("/relation", selectRelation);
router.get("/submit", submit);

module.exports = router;
