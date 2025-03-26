const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const dailyOrderSchema = new Schema({
  date: { type: Date, reqruied: true },
  package: { type: ObjectId, ref: "Package", required: true },
  lastUpdated: Date,
  status: { type: String, uppercase: true, default: "FILLED" },
  items: { type: [ObjectId], ref: "Item" },
  orderedQty: { type: Number, default: 0 },
});

const model = mongoose.model("Daily Order", dailyOrderSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} DailyOrder
 * @typedef {"FILLED"} DailyOrderStatus
 */

module.exports = model;
