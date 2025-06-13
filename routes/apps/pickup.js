const express = require("express");
const router = express.Router();
const {
  get,
  add,
  remove,
  clear,
  clearCanvas,
  setRelation,
  submit,
} = require("../../controllers/apps/pickup");

router.get("/get/:type", get);
router.post("/remove", remove);
router.post("/add", add);
router.get("/clear-canvas", clearCanvas);
router.get("/clear", clear);
router.post("/relation", setRelation);
router.get("/submit", submit);

module.exports = router;
