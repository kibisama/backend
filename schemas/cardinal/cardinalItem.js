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
  invoiceCost: String,
  retailPriceChanged: String,
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

  //   altCIN: [String],
  //   altNDC: [String],
  //   altTradeName: [String],
  //   altStrength: [String],
  //   altForm: [String],
  //   altSize: [String],
  //   altType: [String],
  //   altCost: [String],
  //   altContract: [String],
  //   cardinalHistOrderDate: [String],
  //   cardinalHistInvoiceDate: [String],
  //   cardinalHistOrderQty: [String],
  //   cardinalHistShipQty: [String],
  //   cardinalHistUnitCost: [String],
  //   cardinalHistTotalCost: [String],
  //   cardinalHistInvoiceNum: [String],
  //   cardinalHistOrderMethod: [String],
  //   cardinalWACEffectiveDate: [String],
  //   cardinalWAC: [String],
  //   cardinalWACPercentChange: [String],
  //   dateLastUpdatedCardinal: Date,
  //   lastDateCardinalPriceMatched: Date,
});

module.exports = mongoose.model("Cardinal Item", cardinalItemSchema);
