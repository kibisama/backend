const Package = require("../../schemas/inventory/package");
const Alternative = require("../../schemas/inventory/alternative");
const createAlternativeAndFamily = require("./createAlternativeAndFamily");

/**
 * Links a Package document with an Alternative document. Creates an Alternative document if not exists.
 * @param {Package} package
 * @returns {Promise<Alternative|undefined>}
 */
module.exports = async function link(package) {
  try {
    const { rxcui, _id } = package;
    if (!rxcui) {
      return;
    }
    const alt = await Alternative.findOneAndUpdate(
      { rxcui },
      { $addToSet: { packages: _id } },
      { new: true }
    );
    if (alt) {
      await Package.findOneAndUpdate({ _id }, { alternative: alt._id });
      return alt;
    } else {
      const alt = await createAlternativeAndFamily(rxcui);
      if (alt) {
        return await link(package);
      }
    }
  } catch (e) {
    console.log(e);
  }
};
