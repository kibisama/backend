const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema({
  rxNumber: {
    type: [String],
    index: true,
    validate: (v) => v.length > 0,
  },
  date: {
    type: Date,
    required: true,
  },
  relation: {
    type: String,
    enum: ["self", "ff", "gc", "other"],
    required: true,
  },
  notes: String,
  deliveryDate: {
    type: Date,
    required: true,
  },
});
const model = mongoose.model("Pickup", pickupSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Pickup
 * @typedef {"self"|"ff"|"gc"|"other"} Relation
 */

module.exports = model;
