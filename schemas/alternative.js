const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const alternativeSchema = new Schema({
  rxcui: {
    type: String,
    required: true,
    unique: true,
  },

  /* Internal data */
  name: String,
  // active: { type: Boolean, default: true },

  /* Updated via getRxcuiHistoryStatus */
  isBranded: Boolean,
  /* Updated via getAllRelatedInfo */
  defaultName: { type: String, uppercase: true },

  /* Relational */
  genAlt: {
    type: ObjectId,
    ref: "Alternative",
  },
  packages: {
    type: [ObjectId],
    ref: "Package",
  },
  family: {
    type: ObjectId,
    ref: "Family",
  },
  cahProduct: {
    type: ObjectId,
    ref: "Cardinal Product",
  },
  psAlternative: {
    type: ObjectId,
    ref: "PharmSaver Alternative",
  },
});
const model = mongoose.model("Alternative", alternativeSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Alternative
 */
module.exports = model;
