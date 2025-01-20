const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const dailyOrderSchema = new Schema({
  lastUpdated: Date,
  date: Date,
  status: { type: String, uppercase: true },
  items: { type: [ObjectId], ref: "Item" },
  package: { type: ObjectId, ref: "Package" },
  orderedQty: { type: Number, default: 0 },
  targetCost: String,
  targetNdc: String,
  targetVendor: String,
});

module.exports = mongoose.model("Daily Order", dailyOrderSchema);
