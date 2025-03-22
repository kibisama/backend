const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const alternativeSchema = new Schema({
  rxcui: {
    type: [String],
    validate: (v) => v.length > 0,
  },
  sbd: { type: String, unique: true },
  scd: { type: String, unique: true },

  /* Internal data */
  name: String,
  defaultName: { type: String, uppercase: true },

  /* Relational */
  packages: {
    type: [ObjectId],
    ref: "Package",
  },
  //   family: {
  //     type: ObjectId,
  //     ref: "Family",
  //   },
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
