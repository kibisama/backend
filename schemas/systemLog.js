const mongoose = require("mongoose");
const { Schema } = mongoose;

const systemLogSchema = new Schema({
  date: { type: String, required: true, unique: true }, // "MM/DD/YYYY"
  CAH_UPSERT_ITEMS_VIA_DSCSA: Boolean,
  CAH_RETURN_REQUEST: Boolean,
});

const model = mongoose.model("System Log", systemLogSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} SystemLog
 */

module.exports = model;
