const Settings = require("../../schemas/apps/settings");

const preset = {
  storeName: "El Camino Pharmacy Inc.",
  storeAddress: "10940 Victory Blvd.",
  storeCity: "North Hollywood",
  storeState: "CA",
  storeZip: "91606",
  storePhone: "(818) 763-4334",
  storeFax: "(818) 763-4610",
  storeEmail: "elcaminopharmacy@gmail.com",
  storeManagerLN: "Chang",
  storeManagerFN: "Janice",
};

/** Caching Settings Document **/
let __settings;

(async function () {
  __settings = await Settings.findOne({});
  if (!__settings) {
    __settings = await Settings.create(preset);
  }
})();

/**
 * @returns {Settings.Settings}
 */
exports.getSettings = () => __settings;

/**
 * @param {Settings.SettingsSchema} param
 * @returns {Promise<Settings.Settings>}
 */
exports.updateSettings = async (param) =>
  (__settings = await Settings.findOneAndUpdate(
    { _id: __settings._id, __v: __settings.__v },
    { $set: param, $inc: { __v: 1 } },
    { new: true },
  ));
