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
  storeManager: {
    type: String,
    required: true,
  },
});
module.exports = mongoose.model("App Settings", appSettingsSchema);
