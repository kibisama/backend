const mongoose = require("mongoose");
const { Schema } = mongoose;

const systemLogSchema = new Schema({
  date: { type: String, required: true, unique: true }, // "MM/DD/YYYY"
  CAH_LAST_UPSERT_ITEMS_VIA_DSCSA: Boolean,
});

const model = mongoose.model("System Log", systemLogSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} SystemLog
 */

module.exports = model;
