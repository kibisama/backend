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
    const { ndc } = data;
    const query = { lastUpdated: new Date(), active: true, ...data };
    let psItem = await PSItem.findOneAndUpdate(
      { ndc },
      { $set: query },
      { new: true }
    );
    if (!psItem) {
      psItem = await PSItem.create(query);
    }
    if (package) {
      const { _id } = package;
      await Package.findOneAndUpdate({ _id }, { psItem: psItem._id });
    }
    return psItem;
  } catch (e) {
    console.log(e);
  }
};
