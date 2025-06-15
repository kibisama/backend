const express = require("express");
const router = express.Router();
const {
  get,
  add,
  remove,
  notes,
  clear,
  clearCanvas,
  setRelation,
  preSubmit,
  submit,
} = require("../../controllers/apps/pickup");

router.get("/get/:type", get);
router.post("/remove", remove);
router.post("/add", add);
router.post("/notes", notes);
router.get("/clear-canvas", clearCanvas);
router.get("/clear", clear);
router.post("/relation", setRelation);
router.get("/pre-submit", preSubmit);
router.get("/submit", submit);

module.exports = router;
