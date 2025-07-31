const mongoose = require("mongoose");
const {
  Types: { ObjectId },
} = Schema;

const deliverySchema = new mongoose.Schema({
  facility: {
    type: ObjectId,
    ref: "Facility",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  dRxs: [{ type: ObjectId, ref: "DRx Rx" }],
});
module.exports = mongoose.model("Pickup", deliverySchema);
