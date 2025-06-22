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
  proof,
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
router.post("/submit", submit);
router.post("/find", find);
router.get("/png/:_id", png);
router.post("/proof", proof);

module.exports = router;
