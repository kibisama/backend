const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const familySchema = new Schema({
  scdf: { type: String, required: true, unique: true },

  /* Internal data */
  lastUpdated: Date,
  name: String,

  /* Updated via getAllRelatedInfo */
  defaultName: { type: String, uppercase: true },
  // sbdf: [String],
  rxcui: [String],

  // deaSchedule

  /* Internal data */
  name: String,

  /* Relational */
  alternatives: {
    type: [ObjectId],
    ref: "Alternative",
  },
});
const model = mongoose.model("Family", familySchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Family
 */
module.exports = model;
