const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const drugSchema = new Schema({
  name: { type: String, required: true, uppercase: true },
  /* Required fields for classification */
  rxcui: { type: [String], required: true },
  /* Common fields */
  dea_schedule: String,
  /* Relational */
  children: {
    type: [ObjectId],
    ref: "Alternative",
  },
});

module.exports = mongoose.model("Drug", drugSchema);
