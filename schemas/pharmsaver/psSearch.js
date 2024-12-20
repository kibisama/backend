const mongoose = require("mongoose");
const { Schema } = mongoose;

const psSearchSchema = new Schema({
  lastUpdated: Date,
  query: [String], // 11-digit numbers with no hyphens
  results: [
    {
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
    },
  ],
});

module.exports = mongoose.model("PharmSaver Search", psSearchSchema);
