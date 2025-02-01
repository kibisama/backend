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
  },
  ndc: {
    type: String, // with hyphens
    unique: true,
  },
  ndc11: {
    type: String, // with hyphens
    unique: true,
  },

  /* Definition */
  ndcDir: {
    type: ObjectId,
    ref: "NDC Directory",
  },
  rxcui: String,

  /* Package details */
  brand_name: { type: String, uppercase: true },
  generic_name: { type: String, uppercase: true },
  manufacturerName: { type: String, uppercase: true },
  labeler_name: { type: String, uppercase: true },
  strength: { type: String, uppercase: true },
  size: String,
  sizes: [String],
  unit: { type: String, uppercase: true },
  units: [{ type: String, uppercase: true }],
  /* Internal data */
  name: String,
  mfrName: String,
  optimalQty: { type: Number, default: 0 },
  preferred: { type: Boolean, default: false },
  inventories: {
    type: [ObjectId],
    ref: "Item",
  },

  /* Relational */
  alternative: {
    type: ObjectId,
    ref: "Alternative",
  },
  cardinalProduct: {
    type: ObjectId,
    ref: "Cardinal Product",
  },
  psItem: { type: ObjectId, ref: "PharmSaver Item" },
});

module.exports = mongoose.model("Package", packageSchema);
