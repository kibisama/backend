const PSItem = require("../../schemas/pharmsaver/item");
const Package = require("../../schemas/inventory/package");

/**
 * Inactivates a PS Search document or creates a new document if not exists.
 * @param {string} ndc11 must be 11-digits with hyphens
 * @returns {Promise<PSItem|undefined>}
 */
module.exports = async (ndc11) => {
  try {
    const psItem = await PSItem.findOneAndUpdate(
      { ndc: ndc11.replaceAll("-", "") },
      { $set: { lastUpdated: new Date(), active: false } },
      { new: true, upsert: true }
    );
    await Package.findOneAndUpdate({ ndc11 }, { psItem: psItem._id });
  } catch (e) {
    console.log(e);
  }
};
