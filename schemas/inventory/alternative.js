const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const alternativeSchema = new Schema({
  name: { type: String, required: true, uppercase: true },
  /* Required fields for classification */
  rxcui: { type: [String], required: true },
  strength: { type: [String], uppercase: true }, // Note: OpenFDA does not guarantee its existence nor an uniform unit for the same strength.
  /* Relational */
  children: {
    type: [ObjectId],
    ref: "Package",
  },
});

module.exports = mongoose.model("Alternative", alternativeSchema);
