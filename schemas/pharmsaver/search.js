const mongoose = require("mongoose");
const { Schema } = mongoose;

const psSearch = {
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
};
const psSearchSchema = new Schema({
  lastUpdated: Date,
  active: Boolean,
  query: String, // 11-digit numbers with no hyphens
  result: psSearch,
  alts: [psSearch],
  index: Number,
});

module.exports = mongoose.model("PharmSaver Search", psSearchSchema);
