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
 * @typedef {object} SettingsSchema
 * @property {string} storeName
 * @property {string} storeAddress
 * @property {string} storeCity
 * @property {string} storeState
 * @property {string} storeZip
 * @property {string} storePhone
 * @property {string} storeFax
 * @property {string} storeEmail
 * @property {string} storeManagerLN
 * @property {string} storeManagerFN
 * @typedef {mongoose.HydratedDocument<SettingsSchema>} Settings
 */

module.exports = model;
