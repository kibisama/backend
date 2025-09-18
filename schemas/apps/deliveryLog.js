const mongoose = require("mongoose");
const { Schema } = mongoose;
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
const model = mongoose.model("Delivery Log", deliveryLogSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} DeliveryLog
 */

module.exports = model;
