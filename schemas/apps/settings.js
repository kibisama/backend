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
  storeFax: {
    type: String,
    required: true,
  },
  storeEmail: {
    type: String,
    required: true,
  },
  storeManagerLN: {
    type: String,
    required: true,
  },
  storeManagerFN: {
    type: String,
    required: true,
  },
});

const model = mongoose.model("App Settings", appSettingsSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Settings
 */

module.exports = model;
