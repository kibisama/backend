const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const packageSchema = new Schema({
  name: { type: String, uppercase: true },
  brand_name: { type: String, uppercase: true },
  unii: [String],
  rxcui: [String],
  nui: [String],
  ndc: {
    type: String,
    unique: true,
    required: true,
  },
  ndc11: {
    type: String,
    unique: true,
    required: true,
    minLength: 13,
    maxLength: 13,
  },
  manufacturer_name: {
    type: String,
    uppercase: true,
  },
  product_type: String,
  size: [Number],
  repSize: Number,
  unit: [{ type: String, uppercase: true }],
  repUnit: { type: String, uppercase: true },
  // strength: String,
  optimalQty: Number,
  preferred: { type: Boolean, default: false },
  inventories: {
    type: [ObjectId],
    ref: "Item",
  },
  alternative: { type: ObjectId, ref: "Alternative" },
  ndcDir: {
    type: ObjectId,
    ref: "NDC Directory",
  },
});

module.exports = mongoose.model("Package", packageSchema);
