const { PSItem } = require("../../schemas/pharmsaver");
const { Package } = require("../../schemas/inventory");

/**
 * Creates a PS Item document. If a Package document is passed, the documents will be linked.
 * @param {object} data
 * @param {Package} package
 * @returns {Promise<PSItem|undefined>}
 */
module.exports = async (data, package) => {
  try {
    const psItem = await PSItem.create({
      lastUpdated: new Date(),
      active: true,
      ...data,
    });
    if (package) {
      const { _id } = package;
      await Package.findOneAndUpdate({ _id }, { psItem: psItem._id });
    }
    return psItem;
  } catch (e) {
    console.log(e);
  }
};
