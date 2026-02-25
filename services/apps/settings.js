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

/**
 * @typedef {Settings.Settings} Settings
 */

/** Caching Settings Document **/
let __settings;

/**
 * @returns {Promise<Settings|null>}
 */
exports.getSettings = async () =>
  __settings || (__settings = await createPreset());

/**
 * @returns {Promise<Settings|undefined>}
 */
const createPreset = async () => {
  try {
    const settings = await Settings.findOne({});
    if (!settings) {
      return await Settings.create(preset);
    }
    return settings;
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {SettingsSchema} param
 * @returns {Promise<Settings|undefined>}
 */
exports.updateSettings = async (param) => {
  try {
    return (__settings = await Settings.findOneAndUpdate(
      {},
      { $set: param },
      { new: true }
    ));
  } catch (e) {
    console.error(e);
  }
};
