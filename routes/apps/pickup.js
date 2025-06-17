const express = require("express");
const router = express.Router();
const {
  get,
  add,
  remove,
  date,
  notes,
  clear,
  clearCanvas,
  setRelation,
  preSubmit,
  submit,
  find,
  png,
} = require("../../controllers/apps/pickup");

router.get("/get/:type", get);
router.post("/remove", remove);
router.post("/add", add);
router.post("/date", date);
router.post("/notes", notes);
router.get("/clear-canvas", clearCanvas);
router.get("/clear", clear);
router.post("/relation", setRelation);
router.get("/pre-submit", preSubmit);
router.get("/submit", submit);
router.post("/find", find);
router.get("/png/:_id", png);

module.exports = router;
