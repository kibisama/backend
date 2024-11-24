const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const packageSchema = new Schema({
  name: { type: String, required: true, uppercase: true },
  /* Minimal */
  gtin: {
    type: String,
    unique: true,
    required: true,
  },
  ndc: {
    type: String,
    unique: true,
  },
  ndc11: {
    type: String,
    unique: true,
  },
  /* Package details */
  brand_name: { type: String, uppercase: true },
  generic_name: { type: String, uppercase: true },
  rxcui: [String], // Note: NDC Directory might miss openfda.rxcui
  manufacturer_name: {
    type: String,
    uppercase: true,
  },
  product_type: { type: String, uppercase: true },
  dosage_form: { type: String, uppercase: true },
  active_ingredients: { type: String, uppercase: true },
  strength: { type: String, uppercase: true },
  route: { type: String, uppercase: true },
  size: String, // prefer String type because of possible decimals
  sizes: [String],
  unit: { type: String, uppercase: true },
  units: [{ type: String, uppercase: true }],
  /* Internal data */
  optimalQty: { type: Number, default: 0 },
  preferred: { type: Boolean, default: false },
  /* Relational */
  children: {
    type: [ObjectId],
    ref: "Item",
  },
  ndcDir: {
    type: ObjectId,
    ref: "NDC Directory",
  },
});

module.exports = mongoose.model("Package", packageSchema);
