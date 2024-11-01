const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const drugSchema = new Schema({
  name: { type: String, uppercase: true },
  rxcui: [String],
  generic_name: { type: String, required: true, uppercase: true },
  dea_schedule: String,
  families: {
    type: [ObjectId],
    ref: "Alternative",
  },
});

module.exports = mongoose.model("Drug", drugSchema);
