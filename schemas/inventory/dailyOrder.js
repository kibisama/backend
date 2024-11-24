const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const dailyOrderSchema = new Schema({
  lastUpdated: { type: Date, default: new Date() },
  date: { type: Date, default: new Date() },
  status: { type: String, uppercase: true },
  gtin: String,
  item: {
    type: [ObjectId],
    ref: "Item",
  },
  package: {
    type: ObjectId,
    ref: "Package",
  },
  // cardinalItem: {
  //   type: ObjectId,
  //   ref: "Cardinal Item",
  // },
  // cardinalAlts: {
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
