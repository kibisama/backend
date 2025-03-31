const mongoose = require("mongoose");
const { Schema } = mongoose;

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
  cin: { type: String, unique: true }, // Note: the same product can have more than one cins
  //   priority: { type: Number, default: 0 },
  /* Selected fields */
  //manupartnumber
  // name: String,
  // genericName: String,
  // ndc: String, // 11-digit with hyphens
  // upc: String,
  // gtin: String,
  // brandName: String,
  // mfr: String,
  // amu: String,
  // size: String,
  // form: String,
  // strength: String,
  // orangeBookCode: String,
  //   lastOrdered: String, // "MM/DD/YYYY"
  //   invoiceCost: String,
  //   estNetCost: String,
  //   netUoiCost: String, // 4 decimal places
  // uoifactor
  //   rebateEligible: String, // boolean
  //   returnable: String, // boolean
  //   stockStatus: String,
  //   /* More details */
  //   rx: String, //boolean
  //   deaSchedule: String,
  //   productType: String,
  //   unitOfMeasure: String,
  //   refrigerated: String, //boolean
  //   serialized: String, //boolean
  //   contract: String,
  //   stock: String,
  //   /* Availability alert */
  //   avlAlertUpdated: String,
  //   avlAlertMsg: String,
  //   avlAlertAddMsg: String,
  //   avlAlertExpected: String,
  //   /* Subs & alts */
  //   // alts: [
  //   //   {
  //   //     name: String,
  //   //     genericName: String,
  //   //     ndc: String,
  //   //     cin: String,
  //   //     upc: String,
  //   //     mfr: String,
  //   //     orangeBookCode: String,
  //   //     estNetCost: String,
  //   //     netUoiCost: String,
  //   //     lastOrdered: String,
  //   //     contract: String,
  //   //     stockStatus: String,
  //   //     stock: String,
  //   //   },
  //   // ],
  //   /* Purchase history */
  //   purchaseHistory: [
  //     {
  //       orderDate: String,
  //       invoiceDate: String,
  //       invoiceCost: String,
  //       orderQty: String,
  //       shipQty: String,
  //       unitCost: String,
  //       orderMethod: String,
  //       poNumber: String,
  //       contract: String,
  //       invoiceNumber: String,
  //     },
  //   ],
  //   /* Analysis */
  //   analysis: {
  //     lastCost: String,
  //     lowestHistCost: String,
  //     lastSFDCDate: String,
  //     lastSFDCCost: String,
  //     shipQty: [Number],
  //     maxUnitCost: [String],
  //     source: {
  //       name: String,
  //       genericName: String,
  //       ndc: String,
  //       cin: String,
  //       upc: String,
  //       mfr: String,
  //       orangeBookCode: String,
  //       estNetCost: String,
  //       netUoiCost: String,
  //       lastOrdered: String,
  //       contract: String,
  //       stockStatus: String,
  //       stock: String,
  //       rebateEligible: String,
  //       returnable: String,
  //     },
  //   },
});

const model = mongoose.model("Cardinal Product", cahProductSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} CAHProduct
 */
module.exports = model;
