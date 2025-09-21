const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const deliveryLogSchema = new mongoose.Schema({
  date: {
    type: String, // MMDDYYYY
    required: true,
    index: true,
  },
  station: {
    type: ObjectId,
    ref: "Delivery Station",
    required: true,
  },
  session: {
    type: String,
    required: true,
  },
  dRxes: {
    type: [{ type: ObjectId, ref: "DRx Rx" }],
    validate: (v) => {
      return v.length > 0;
    },
  },
});
const model = mongoose.model(
  "Delivery Log",
  deliveryLogSchema.index({ date: 1, session: 1, station: 1 }, { unique: true })
);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} DeliveryLog
 */

module.exports = model;
