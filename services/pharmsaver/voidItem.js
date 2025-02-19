const { PSItem } = require("../../schemas/pharmsaver");
const { Package } = require("../../schemas/inventory");

/**
 * Voids a related PS Item document.
 * @param {Package} package
 * @returns {Promise<PSItem|undefined>}
 */
module.exports = async (package) => {
  try {
    const { _id, ndc11, psItem } = package;
    const ndc = ndc11.replaceAll("-", "");
    let query = psItem ? { _id: psItem } : { ndc };
    let _psItem = await PSItem.findOneAndUpdate(
      query,
      { $set: { lastUpdated: new Date(), active: false } },
      { new: true }
    );
    if (!_psItem) {
      _psItem = await PSItem.create({
        lastUpdated: new Date(),
        active: false,
        ndc,
      });
    }
    await Package.findOneAndUpdate({ _id }, { psItem: psItem._id });
    return _psItem;
  } catch (e) {
    console.log(e);
  }
};
