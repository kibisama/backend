const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const psItemSchema = new Schema({
  package: {
    type: [ObjectId],
    ref: "Package",
    required: true,
    unique: true,
  },
  lastUpdated: { type: Date, required: true },
  active: { type: Boolean, default: false },
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
const model = mongoose.model("PharmSaver Item", psItemSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} PSItem
 */
module.exports = model;
