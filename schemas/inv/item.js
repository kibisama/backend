const mongoose = require("mongoose");
const { Schema } = mongoose;
const ItemSchema = new Schema({
  gtin: { type: String, required: true, minLength: 14, maxLength: 14 },
  lot: { type: String, required: true, maxLength: 20 },
  sn: { type: String, required: true, maxLength: 20 },
  exp: { type: Date, required: true, minLength: 6, maxLength: 6 },
  method: { type: String, enum: ["SCAN", "DSCSA"], required: true },
  invoiceRef: String,
  cost: String,
  dateReceived: Date,
  source: { type: String, enum: ["CARDINAL", "SECONDARY"] },
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
 * @typedef {"SCAN"|"DSCSA"} Method
 * @typedef {"CARDINAL"|"SECONDARY"} Source
 */
module.exports = model;
