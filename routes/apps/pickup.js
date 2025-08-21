const express = require("express");
const router = express.Router();
const {
  get,
  post,
  //
  getType,
  add,
  remove,
  date,
  notes,
  clear,
  clearCanvas,
  preSubmit,
  submit,
  find,
  png,
  proof,
} = require("../../controllers/apps/pickup");

router.get("/", get);
router.post("/:type", post);
//
router.get("/get/:type", getType);
router.post("/remove", remove);
router.post("/add", add);
router.post("/date", date);
router.post("/notes", notes);
router.get("/clear-canvas", clearCanvas);
router.get("/clear", clear);
router.get("/pre-submit", preSubmit);
router.post("/submit", submit);
router.post("/find", find);
router.get("/png/:_id", png);
router.post("/proof", proof);

module.exports = router;
