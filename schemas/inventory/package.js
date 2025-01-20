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
    required: true,
  },
  /* Minimal */
  ndc: {
    type: String, // with hyphens
    unique: true,
  },
  ndc11: {
    type: String, // with hyphens
    unique: true,
  },
  /* Package details */
  brand_name: { type: String, uppercase: true },
  generic_name: { type: String, uppercase: true },
  labeler_name: { type: String, uppercase: true },
  manufacturerName: { type: String, uppercase: true },
  dosage_form: { type: String, uppercase: true },
  strength: { type: String, uppercase: true },
  size: String,
  sizes: [String],
  unit: { type: String, uppercase: true },
  units: [{ type: String, uppercase: true }],
  /* Internal data */
  optimalQty: { type: Number, default: 0 },
  preferred: { type: Boolean, default: false },
  /* scheduleJob to regularly update if undefined */
  rxcui: String, // required to relate with alternative or family
  /* Relational */
  inventories: {
    type: [ObjectId],
    ref: "Item",
  },
  alternative: {
    type: ObjectId,
    ref: "Alternative",
  },
  ndcDir: {
    type: ObjectId,
    ref: "NDC Directory",
  },
  cardinalProduct: {
    type: [ObjectId],
    ref: "Cardinal Product",
  },
  psSearch: { type: ObjectId, ref: "PharmSaver Search" },
});

module.exports = mongoose.model("Package", packageSchema);
