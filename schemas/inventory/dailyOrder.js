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
  // ndc11: String,

  cardinalCost: String,
  cardinalAlt: {
    cin: String,
    ndc: String,
    size: String,
    cost: String,
    uoiCost: String,
    contract: String,
  },
  //
  secondaryDetails: {
    pkgPrice: String,
    qtyAvl: String,
    wholesaler: String,
    lotExpDate: String,
  },
  // secondaryAlt : {type: Object}
  // lastRequestSent: Date,
  // reason: String,
});

module.exports = mongoose.model("Daily Order", dailyOrderSchema);
