const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const familySchema = new Schema({
  rxcui: { type: [String], required: true, unique: true },

  /* Properties */
  _name: { type: String, uppercase: true },
  _rxcui: { type: [String], required: true },
  dea_schedule: String,

  /* Internal data */
  name: String,

  /* Relational */
  alternatives: {
    type: [ObjectId],
    ref: "Alternative",
  },
});

module.exports = mongoose.model("Family", familySchema);
