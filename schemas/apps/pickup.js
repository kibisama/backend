const mongoose = require("mongoose");

const pickupSchema = new mongoose.Schema({
  rxNumber: {
    type: [String],
    validate: (v) => v.length > 0,
  },
  date: {
    type: Date,
    required: true,
  },
  relation: {
    type: String,
    required: true,
  },
  notes: String,
  deliveryDate: {
    type: Date,
    required: true,
  },
});
module.exports = mongoose.model("Pickup", pickupSchema);
