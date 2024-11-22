const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const dailyOrderSchema = new Schema({
  lastUpdated: Date,
  date: { type: Date, default: Date.now() },
  item: {
    type: ObjectId,
    ref: "Item",
  },
  orderStatus: { type: String, uppercase: true },
  package: {
    type: ObjectId,
    ref: "Package",
  },
  // cardinalItem: {
  //   type: ObjectId,
  //   ref: "Cardinal Item",
  // },
  // cardinalAlt: {
  //   cin: String,
  //   ndc: String,
  //   size: String,
  //   cost: String,
  //   uoiCost: String,
  //   contract: String,
  // },
  psDetails: {
    lastUpdated: Date,
    description: String,
    pkgPrice: String,
    qtyAvl: String,
    unitPrice: String,
    wholesaler: String,
    lotExpDate: String,
  },
  psAlts: [
    {
      description: String,
      pkg: String,
      pkgPrice: String,
      ndc: String,
      qtyAvl: String,
      unitPrice: String,
      rxOtc: String,
      wholesaler: String,
      manufacturer: String,
    },
  ],
});

module.exports = mongoose.model("Daily Order", dailyOrderSchema);
