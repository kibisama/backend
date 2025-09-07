const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const psPackageSchema = new Schema({
  package: {
    type: ObjectId,
    ref: "Package",
    required: true,
    unique: true,
  },
  lastRequested: Date,
  lastUpdated: Date,
  active: Boolean,
  description: String,
  str: String,
  pkg: String,
  form: String,
  pkgPrice: String,
  ndc: String,
  qtyAvl: String,
  unitPrice: String,
  rxOtc: String,
  lotExpDate: String,
  bG: String,
  wholesaler: String,
  manufacturer: String,
});
const model = mongoose.model("PharmSaver Package", psPackageSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} PSPackage
 */
module.exports = model;
