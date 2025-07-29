const mongoose = require("mongoose");

const appSettingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: true,
  },
  storeAddress: {
    type: String,
    required: true,
  },
  storeCity: {
    type: String,
    required: true,
  },
  storeState: {
    type: String,
    required: true,
  },
  storeZip: {
    type: String,
    required: true,
  },
  storePhone: {
    type: String,
    required: true,
  },
  storeFax: String,
  storeEmail: String,
  storeManagerLN: String,
  storeManagerFN: String,
});

const model = mongoose.model("App Settings", appSettingsSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Settings
 */

module.exports = model;
