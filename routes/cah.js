const express = require("express");
const path = require("path");
const router = express.Router();

router.get("/img/:cin", (req, res) =>
  res.sendFile(
    path.join(__dirname, "../img/pharma-medium", `${req.params.cin}.jpg`)
  )
);

module.exports = router;
