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
  packages: {
    type: [ObjectId],
    ref: "Package",
  },
  family: {
    type: ObjectId,
    ref: "Family",
  },
  //   cardinalSource: {
  //     type: ObjectId,
  //     ref: "Cardinal Product",
  //   },
  //   sourcePackage: {
  //     type: ObjectId,
  //     ref: "Package",
  //   },
  //   psSearch: {
  //     type: ObjectId,
  //     ref: "PharmSaver Search",
  //   },
});
const model = mongoose.model("Alternative", alternativeSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Alternative
 */
module.exports = model;
