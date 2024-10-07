const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const packageSchema = new Schema({
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
  dosage_form: { type: String, required: true, uppercase: true },
  manufacturer_name: {
    type: String,
    required: true,
    uppercase: true,
  },
  size: [Number],
  unit: [{ type: String, uppercase: true }],
  preferred: { type: Boolean, default: false },
  inventories: {
    type: [ObjectId],
    ref: "Item",
  },
  ndcDir: {
    type: ObjectId,
    ref: "NDC Directory",
    required: true,
  },
  // add price data here
});

module.exports = mongoose.model("Package", packageSchema);
