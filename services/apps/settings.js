const SETTINGS = require("../../schemas/apps/settings");

const preset = {
  storeName: "El Camino Pharmacy",
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
 * @typedef {SETTINGS.Settings} Settings
 * @typedef {Parameters<SETTINGS["findOneAndUpdate"]>["1"]} UpdateParam
 */

/**
 * @returns {Promise<Settings|null>}
 */
const getSettings = async () => {
  try {
    return await SETTINGS.findOne({});
  } catch (e) {
    console.log(e);
  }
};

/**
 * @returns {Promise<Settings>}
 */
exports.createPreset = async () => {
  try {
    const settings = await getSettings();
    if (!settings) {
      return await SETTINGS.create(preset);
    }
    return settings;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {UpdateParam} param
 * @returns {Promise<Settings>}
 */
exports.updateSettings = async (param) => {
  try {
    return await SETTINGS.findOneAndUpdate({}, { $set: param }, { new: true });
  } catch (e) {
    console.log(e);
  }
};
