const mongoose = require("mongoose");
const { Schema } = mongoose;

const planSchema = new Schema({
  planID: { type: String, required: true, unique: true, immutable: true },
  planName: String,
  ansiBin: String,
  pcn: String,
});

const model = mongoose.model("DRx Plan", planSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Plan
 */

module.exports = model;
