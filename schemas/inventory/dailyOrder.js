const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const dailyOrderSchema = new Schema({
  // One Date One Reprot. Please follow the date format as "MM-DD-YYYY"
  date: { type: String, required: true, unique: true },
  item: {
    type: [ObjectId],
    ref: "Item",
  },
  prevCost: [String],
  prevSource: [String],
  cardinalPrice: [String],
  referPrice: [String],
  //   referItem : {type: [ObjectId], ref: "Pharmsaver"}
  status: [String],
  countRequest: [Number],
  lastRequestSent: [Date],
  reason: [String],
});

module.exports = mongoose.model("Daily Order", dailyOrderSchema);
