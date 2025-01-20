const Package = require("../../schemas/inventory/package");

/**
 * Adds/pulls an Item to/from the inventories field of Package.
 * @param {Item} item
 * @param {string} mode
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (item, mode) => {
  try {
    const { gtin, _id } = item;
    if (mode === "FILL" || mode === "RETURN") {
      return await Package.findOneAndUpdate(
        { gtin },
        { $pull: { inventories: _id } },
        { new: true }
      );
    } else {
      return await Package.findOneAndUpdate(
        { gtin },
        { $addToSet: { inventories: _id } },
        { new: true }
      );
    }
  } catch (e) {
    console.log(e);
  }
};
