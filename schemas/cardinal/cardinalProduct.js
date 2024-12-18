const mongoose = require("mongoose");
const { Schema } = mongoose;

const cardinalProductSchema = new Schema({
  /* Internal data */
  lastUpdated: Date,
  priority: { type: Number, default: 0 },
  /* Selected fields uppercase required */
  name: String,
  genericName: String,
  ndc: String, // 11-digit numbers with hyphens
  cin: { type: String, unique: true }, // the same product can have multiple cins
  upc: String,
  gtin: String,
  brandName: String,
  mfr: String,
  amu: String,
  size: String,
  form: String,
  strength: String,
  orangeBookCode: String,
  lastOrdered: String, // "MM/DD/YYYY"
  estNetCost: String,
  netUoiCost: String, // 4 decimal places
  rebateEligible: String, // boolean
  returnable: String, // boolean
  stockStatus: String,
  rx: String, //boolean
  deaSchedule: String,
  productType: String,
  unitOfMeasure: String,
  refrigerated: String, //boolean
  serialized: String, //boolean
  contract: String,
  stock: String,
  medispanGpi: String,
  gcn: String,
  gcnSequence: String,
  alts: [
    {
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
  ],
  /* Purchase history */
  purchaseHistory: [
    {
      orderDate: String,
      invoiceDate: String,
      invoiceCost: String,
      orderQty: String,
      shipQty: String,
      unitCost: String,
      orderMethod: String,
      poNumber: String,
      contract: String,
      invoiceNumber: String,
    },
  ],
});

module.exports = mongoose.model("Cardinal Product", cardinalProductSchema);
