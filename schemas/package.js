const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const packageSchema = new Schema({
  unii: [String],
  ingredients: [{ type: String, uppercase: true }],
  name: { type: String, uppercase: true },
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
    minLength: 13,
    maxLength: 13,
  },
  dosage_form: { type: String, uppercase: true },
  manufacturer_name: {
    type: String,
    required: true,
    uppercase: true,
  },
  size: [Number],
  unit: [{ type: String, uppercase: true }],
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
  // add price data here
});

module.exports = mongoose.model("Package", packageSchema);
