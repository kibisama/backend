const mongoose = require("mongoose");
const { Schema } = mongoose;

const psItemSchema = new Schema({
  lastUpdated: Date,
  active: Boolean,
  description: String,
  str: String,
  pkg: String,
  form: String,
  pkgPrice: String,
  ndc: String,
  qtyAvl: String,
  unitPrice: String,
  rxOtc: String,
  lotExpDate: String,
  bG: String,
  wholesaler: String,
  manufacturer: String,
});

module.exports = mongoose.model("PharmSaver Item", psItemSchema);
