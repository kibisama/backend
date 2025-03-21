const mongoose = require("mongoose");
const { Schema } = mongoose;
const ItemSchema = new Schema({
  gtin: { type: String, required: true, minLength: 14, maxLength: 14 },
  lot: { type: String, required: true, maxLength: 20 },
  sn: { type: String, required: true, maxLength: 20 },
  exp: { type: Date, required: true, minLength: 6, maxLength: 6 },
  cost: String,
  dateReceived: Date,
  source: { type: String, uppercase: true },
  dateFilled: Date,
  dateReversed: Date,
  dateReturned: Date,
});
const model = mongoose.model(
  "Item",
  ItemSchema.index({ gtin: 1, sn: 1 }, { unique: true })
);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Item
 */
module.exports = model;
