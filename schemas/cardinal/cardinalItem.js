const mongoose = require("mongoose");
const { Schema } = mongoose;

const cardinalItemSchema = new Schema({
  lastUpdated: Date,
  cin: { type: String, unique: true },
  title: String,
  fdbLabelName: String,
  genericName: String,
  ndc: String,
  upc: String,
  contract: String,
  strength: String,
  form: String,
  stockStatus: String,
  qtyAvailable: String,
  estNetCost: String,
  netUoiCost: String,
  retailPriceChanged: Date,
  fdbMfrName: String,
  // Possible Number Type?
  packageQty: String,
  packageSize: String,
  productType: String,
  unit: String,
  deaSchedule: String,
  abRating: String,
  returnPackaging: String,
  specialty: String,

  altCin: [String],
  altNdc: [String],
  altTradeName: [String],
  altMfr: [String],
  altSize: [String],
  altType: [String],
  altNetCost: [String],
  altNetUoiCost: [String],
  altContract: [String],

  histInvoiceDate: [Date],
  // Negative numbers are formatted as (Number)
  histShipQty: [String],
  // Negative numbers are formatted as (\$Number)
  histUnitCost: [String],
  histContract: [String],
  histInvoiceNumber: [String],
  histOrderMethod: [String],

  // STRAIGHTFOWARD ORDERING BOOKMARK BOOLEAN
  lastNegotiated: Date,
});

module.exports = mongoose.model("Cardinal Item", cardinalItemSchema);
