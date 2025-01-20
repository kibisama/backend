const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const familySchema = new Schema({
  name: { type: String, uppercase: true },
  rxcui: { type: [String], required: true },
  _rxcui: { type: [String], required: true },
  dea_schedule: String,
  alternatives: {
    type: [ObjectId],
    ref: "Alternative",
  },
});

module.exports = mongoose.model("Family", familySchema);
