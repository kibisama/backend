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
    minLength: 14,
    maxLength: 14,
  },
  ndc: {
    type: String,
    unique: true,
    sparse: true,
    minLength: 12,
    maxLength: 12,
  },
  ndc11: {
    type: String,
    unique: true,
    sparse: true,
    minLength: 13,
    maxLength: 13,
  },

  upc: {
    type: String,
  },
  mpn: {
    type: String,
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
