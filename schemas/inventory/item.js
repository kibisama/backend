const mongoose = require("mongoose");
const { Schema } = mongoose;

const itemSchema = new Schema({
  gtin: { type: String, required: true, minLength: 14, maxLength: 14 },
  lot: { type: String, required: true, maxLength: 20 },
  sn: { type: String, required: true, maxLength: 20 },
  exp: { type: Date, required: true, minLength: 6, maxLength: 6 },
  cost: Number,
  dateReceived: Date,
  source: { type: String, default: "unknown" },
  dateFilled: Date,
  dateReversed: Date,
  dateReturned: Date,
});

module.exports = mongoose.model("Item", itemSchema);
