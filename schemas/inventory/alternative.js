const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const alternativeSchema = new Schema({
  rxcui: { type: [String], required: true, unique: true },

  /* Properties */
  _name: { type: String, uppercase: true },
  form: { type: String, uppercase: true },

  /* Internal data */
  name: { type: String },

  /* Relational */
  packages: {
    type: [ObjectId],
    ref: "Package",
  },
  family: {
    type: ObjectId,
    ref: "Family",
  },
  cardinalSource: {
    type: ObjectId,
    ref: "Cardinal Product",
  },
  psSearch: {
    type: ObjectId,
    ref: "PharmSaver Search",
  },
});

module.exports = mongoose.model("Alternative", alternativeSchema);
