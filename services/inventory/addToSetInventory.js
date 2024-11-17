const Package = require("../../schemas/inventory/package");

/**
 * Adds an Item document id to the children field of Package.
 * @param {Item} item
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (item) => {
  try {
    const { gtin, _id } = item;
    return await Package.findOneAndUpdate(
      {
        gtin,
      },
      { $addToSet: { children: _id } },
      { new: true }
    );
  } catch (e) {
    console.log(e);
  }
};
