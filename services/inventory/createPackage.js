const Package = require("../../schemas/inventory/package");
const NdcDir = require("../../schemas/openfda/ndcDir");
const definePackageFields = require("./definePackageFields");
const updatePackage = require("./updatePackage");
const linkPackageWithAlternative = require("./linkPackageWithAlternative");
const updatePackageRelations = require("./updatePackageRelations");

/**
 * Creates a Package document.
 * @param {string} gtin
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (gtin) => {
  try {
    const regEx = new RegExp(
      String.raw`${gtin.slice(3, 7)}-?${gtin[7]}-?${gtin.slice(8, 11)}-?${
        gtin[11]
      }-?${gtin[12]}`
    );
    const query = { gtin, name: gtin };
    const ndcDir = await NdcDir.findOne({
      packaging: { $elemMatch: { description: { $regex: regEx } } },
    });
    if (ndcDir) {
      const reference = await Package.findOne({ ndcDir: ndcDir._id });
      if (reference) {
        const { rxcui } = reference;
        query.rxcui = rxcui;
      }
      Object.assign(query, definePackageFields(gtin, ndcDir));
    } else {
      const package = await updatePackage(gtin);
      if (package) {
        return package;
      }
    }
    const result = await Package.create(query);
    if (result.rxcui) {
      linkPackageWithAlternative(result);
    }
    await updatePackageRelations(result);
    return result;
  } catch (e) {
    console.log(e);
  }
};
