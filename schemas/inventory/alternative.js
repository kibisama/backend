const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const alternativeSchema = new Schema({
  name: { type: String, uppercase: true },
  rxcui: [String],
  strength: [{ type: String, uppercase: true }],
  alternatives: {
    type: [ObjectId],
    ref: "Package",
  },
  // optimalQty: Number,
  // unit: String,
});

module.exports = mongoose.model("Alternative", alternativeSchema);
