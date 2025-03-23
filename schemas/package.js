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
    minLength: 14,
    maxLength: 14,
  },
  ndc: {
    type: String,
    unique: true,
    minLength: 12,
    maxLength: 12,
  },
  ndc11: {
    type: String,
    unique: true,
    minLength: 13,
    maxLength: 13,
  },

  /* Package details */
  /* Updated via getNDCStatus */
  rxcui: String,

  /* Internal data */
  name: String,
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
  //   cardinalProduct: {
  //     type: ObjectId,
  //     ref: "Cardinal Product",
  //   },
  //   psItem: { type: ObjectId, ref: "PharmSaver Item" },
});
const model = mongoose.model("Package", packageSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Package
 */
module.exports = model;
