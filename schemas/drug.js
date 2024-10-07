const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const drugSchema = new Schema({
  unii: { type: [String], required: true },
  rxcui: { type: [String], required: true },
  brand_name_base: { type: String, required: true },
  dea_schedule: {
    type: String,
    required: true,
  },
  families: {
    type: [ObjectId],
    ref: "Alternative",
  },
});

module.exports = mongoose.model("Drug", drugSchema);
