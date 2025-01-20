const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const alternativeSchema = new Schema({
  name: { type: String, uppercase: true },
  rxcui: { type: [String], required: true },
  packages: {
    type: [ObjectId],
    ref: "Package",
  },
  family: {
    type: ObjectId,
    ref: "Family",
  },
});

module.exports = mongoose.model("Alternative", alternativeSchema);
