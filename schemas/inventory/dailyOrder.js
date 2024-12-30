const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const psDetails = {
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
  wholesaler: String,
  manufacturer: String,
};

const dailyOrderSchema = new Schema({
  lastUpdated: Date,
  date: Date,
  status: { type: String, uppercase: true },
  item: {
    type: [ObjectId],
    ref: "Item",
  },
  package: {
    type: ObjectId,
    ref: "Package",
  },
  /* Cardinal search results */
  cardinalProduct: {
    type: ObjectId,
    ref: "Cardinal Product",
  },
  cardinalProductAnalysis: {
    lowestHistCost: String,
    lastSFDCdate: String,
    lastSFDCcost: String,
    shipQty: [Number],
    maxUnitCost: [String],
  },
  cardinalAlt: {
    name: String,
    genericName: String,
    ndc: String,
    cin: String,
    upc: String,
    mfr: String,
    orangeBookCode: String,
    estNetCost: String,
    netUoiCost: String,
    contract: String,
    stockStatus: String,
    stock: String,
  },
  /* Pharmsaver search results */
  psLastUpdated: Date,
  /* the cheapest exact same package long-dated (higher priority) or short-dated */
  psDetails,
  /* two cheapest of different ndcs including short-dated lots (one with the same pkg, one any) */
  /* if no psDetails found, the cheapest package with each unique description */
  psAlts: [psDetails],
});

module.exports = mongoose.model("Daily Order", dailyOrderSchema);
