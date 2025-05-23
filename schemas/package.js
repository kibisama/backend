const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const packageSchema = new Schema({
  /* Key fields */
  gtin: {
    type: String,
    unique: true,
    sparse: true,
  },
  ndc: {
    type: String,
    unique: true,
    sparse: true,
  },
  ndc11: {
    type: String,
    unique: true,
    sparse: true,
  },

  upc: {
    type: String,
    unique: true,
    sparse: true,
  },
  mpn: {
    type: String,
    unique: true,
    sparse: true,
  },

  /* Package details */
  /* Updated via getNDCStatus */
  rxcui: String,
  /* Updated via getNDCProperties */
  mfr: String,
  schedule: String,
  shape: String,
  shapeSize: String,
  color: String,
  imprint: String,
  /* Updated via OpenFDA */
  size: String,
  unit: String,

  /* Internal data */
  name: String,
  mfrName: String,
  inventories: {
    type: [ObjectId],
    ref: "Item",
  },
  active: { type: Boolean, default: false },

  /* Relational */
  alternative: {
    type: ObjectId,
    ref: "Alternative",
  },
  cahProduct: {
    type: ObjectId,
    ref: "Cardinal Product",
  },
  psPackage: { type: ObjectId, ref: "PharmSaver Package" },
});
const model = mongoose.model("Package", packageSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Package
 */
module.exports = model;
