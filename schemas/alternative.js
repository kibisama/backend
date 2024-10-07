const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const alternativeSchema = new Schema({
  unii: { type: [String], required: true },
  rxcui: { type: [String], required: true },
  strength: { type: [{ type: String, uppercase: true }], required: true },
  alternatives: {
    type: [ObjectId],
    ref: "Package",
  },
  optimalQty: Number,
});

module.exports = mongoose.model("Alternative", alternativeSchema);
