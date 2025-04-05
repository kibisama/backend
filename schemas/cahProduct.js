const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const cahProductSchema = new Schema({
  /* Internal data */
  package: {
    type: ObjectId,
    ref: "Package",
    required: true,
    unique: true,
  },
  lastUpdated: { type: Date, required: true },
  active: { type: Boolean, default: false },
  //   priority: { type: Number, default: 0 },
  /* Common fields */
  cin: { type: String, unique: true }, // Note: the same product can have more than one cins
  name: String,
  genericName: String,
  ndc: String, // 11-digit with hyphens
  upc: String,
  mfr: String,
  orangeBookCode: String,
  lastOrdered: String, // "MM/DD/YYYY"
  estNetCost: String,
  netUoiCost: String, // 4 decimal places
  contract: String,
  rebateEligible: Boolean,
  returnable: Boolean,
  stockStatus: String,
  stock: String,
  /* Selected fields */
  invoiceCost: String,
  gtin: String,
  mpn: String,
  brandName: String,
  amu: String,
  size: String, // n X n.nnn Units
  form: String,
  strength: String,

  //   /* More details */
  rx: Boolean,
  deaSchedule: String,
  productType: String,
  unit: String,
  refrigerated: Boolean,
  serialized: Boolean,

  /* Availability alert */
  avlAlertUpdated: String,
  // avlAlertMsg: String,
  avlAlertAddMsg: String,
  avlAlertExpected: String,

  /* PurchaseHistoryEval */
  lastCost: String,
  histLow: String,
  lastSFDCDate: String,
  lastSFDCCost: String,
});

const model = mongoose.model("Cardinal Product", cahProductSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} CAHProduct
 * @typedef {string|CAHNoData} CAHData
 * @typedef {"— —"} CAHNoData
 * @typedef {"IN STOCK"|"LOW STOCK"|"OUT OF STOCK"|"INELIGIBLE"} StockStatus
 * @typedef {"Yes"|"No"} BooleanText
 * @typedef {"YES"|"NO"} BooleanTextCaps
 * @typedef {"done"|"clear"|"close"} BooleanIcon
 */
module.exports = model;
