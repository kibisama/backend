const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const psAlternativeSchema = new Schema({
  alternative: {
    type: ObjectId,
    ref: "Alternative",
    required: true,
    unique: true,
  },
  lastUpdated: { type: Date, required: true },
  active: { type: Boolean, default: false },
  items: [
    {
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
    },
  ],
});

/**
 * @typedef {object} Result
 * @property {string} description
 * @property {string} str
 * @property {string} pkg
 * @property {string} form
 * @property {string} pkgPrice
 * @property {string} ndc
 * @property {string} qtyAvl
 * @property {string} unitPrice
 * @property {"Rx"|"OTC"} rxOtc
 * @property {string} lotExpDate
 * @property {"B"|"G"} bG
 * @property {string} wholesaler
 * @property {string} manufacturer
 */

const model = mongoose.model("PharmSaver Alternative", psAlternativeSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} PSAlternative
 */
module.exports = model;
