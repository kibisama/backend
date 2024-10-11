const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const alternativeSchema = new Schema({
  rxcui: [String],
  name: { type: String, uppercase: true },
  strength: [{ type: String, uppercase: true }],
  alternatives: {
    type: [ObjectId],
    ref: "Package",
  },
  optimalQty: Number,
  unit: String, //
});

module.exports = mongoose.model("Alternative", alternativeSchema);
