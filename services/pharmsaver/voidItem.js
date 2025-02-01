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
    if (psItem) {
      return await PSItem.findOneAndUpdate(
        { _id: psItem },
        { $set: { lastUpdated: new Date(), active: false } }
      );
    } else {
      const psItem = await PSItem.create({
        lastUpdated: new Date(),
        active: false,
        ndc: ndc11.replaceAll("-", ""),
      });
      await Package.findOneAndUpdate({ _id }, { psItem: psItem._id });
      return psItem;
    }
  } catch (e) {
    console.log(e);
  }
};
