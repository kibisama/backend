const { Package, Alternative } = require("../../../schemas/inventory");
const createAlternative = require("../alternative/createAlternative");

/**
 * Links a Package document with an Alternative document. Creates an Alternative document if not exists.
 * @param {Package} package
 * @returns {Promise<Package|undefined>}
 */
module.exports = async function link(package) {
  try {
    const { rxcui, _id } = package;
    if (!rxcui) {
      return;
    }
    const alt = await Alternative.findOneAndUpdate(
      { rxcui },
      { $addToSet: { packages: _id } }
    );
    if (!alt) {
      const alt = await createAlternative(rxcui);
      if (alt) {
        return await link(package);
      }
    } else {
      return await Package.findOneAndUpdate(
        { _id },
        { alternative: alt._id },
        { new: true }
      );
    }
  } catch (e) {
    console.log(e);
  }
};
