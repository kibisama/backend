const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema({
  rxNumber: {
    type: [String],
    validate: (v) => v.length > 0,
  },
  type: {
    type: String,
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
  dateSaved: {
    type: Date,
    required: true,
  },
  deliveryDate: {
    type: Date,
    required: true,
  },
  notes: String,
});
module.exports = mongoose.model("Pickup", pickupSchema);
