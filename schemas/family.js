const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const familySchema = new Schema({
  rxcui: {
    type: [String],
    validate: (v) => v.length > 0,
  },

  /* Internal data */
  name: String,

  /* Updated via getAllRelatedInfo */
  genericName: { type: String, uppercase: true },
  brandName: { type: String, uppercase: true },
  _rxcui: [String],

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
