const mongoose = require("mongoose");
const { Schema } = mongoose;

const planSchema = new Schema({
  planID: { type: String, required: true, unique: true },
  planName: String,
  ansiBin: String,
  pcn: String,
});

const model = mongoose.model("DRx Plan", planSchema);
/**
 * @typedef {object} DRxPlanSchema
 * @property {string} planID
 * @property {string} [planName]
 * @property {string} [ansiBin]
 * @property {string} [pcn]

 * @typedef {mongoose.HydratedDocument<DRxPlan>} DRxPlan
 */

module.exports = model;
