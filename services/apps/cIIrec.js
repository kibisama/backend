const mongoose = require("mongoose");
const { Schema } = mongoose;

const cIIRecSchema = new Schema({
  date: { type: Date, required: true },
  dateString: { type: String, requird: true, unique: true },
  items: [
    {
      name: String,
      ndc: String,
      qtyLast: Number,
      purchased: Number,
      dispensed: Number,
      sold: Number,
      returned: Number,
      calculated: Number,
      actual: Number,
      discrepancy: Number,
      notes: String,
    },
  ],
});

const model = mongoose.model("CII Rec Report", cIIRecSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} CIIRec
 */

module.exports = model;
