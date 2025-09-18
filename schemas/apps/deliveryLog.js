const mongoose = require("mongoose");
const {
  Types: { ObjectId },
} = Schema;

const deliveryLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  session: {
    type: Number,
    required: true,
  },
  station: {
    type: ObjectId,
    ref: "Delivery Station",
    required: true,
  },
  dRxs: [{ type: ObjectId, ref: "DRx Rx" }],
});
module.exports = mongoose.model("Delivery Log", deliveryLogSchema);
