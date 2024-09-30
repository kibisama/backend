const mongoose = require("mongoose");
const { Schema } = mongoose;

const inventorySchema = new Schema({
  gtin: String,
  lot: String,
  sn: String,
  exp: Date,
  dateReceived: Date,
  source: String,
  dateFilled: Date,
  dateReversed: Date,
  dateReturned: Date,
});

module.exports = mongoose.model("Inventory", inventorySchema);
