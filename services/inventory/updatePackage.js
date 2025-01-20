const Package = require("../../schemas/inventory/package");
const updateLocalNdcDir = require("../openFDA/updateLocalNdcDir");
const findNdcPropertiesByGtin = require("../rxnav/findNdcPropertiesByGtin");
const definePackageFields = require("./definePackageFields");
const linkPackageWithAlternative = require("./linkPackageWithAlternative");

/**
 * Tries to update local NDC Directory & Package documents (upsert is true).
 * @param {string} gtin
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (gtin) => {
  try {
    const ndcDir = await updateLocalNdcDir(gtin, "gtin");
    const ndcProperties = await findNdcPropertiesByGtin(gtin);
    let query;
    if (ndcDir instanceof Error) {
      if (ndcProperties instanceof Error) {
        return;
      } else {
        query = ndcProperties;
      }
    } else {
      query = definePackageFields(gtin, ndcDir);
      if (!(ndcProperties instanceof Error)) {
        query.rxcui = ndcProperties.rxcui;
      }
    }
    const result = await Package.findOneAndUpdate({ gtin }, query, {
      new: true,
      upsert: true,
    });
    if (result.rxcui) {
      linkPackageWithAlternative(result);
    }
    return result;
  } catch (e) {
    console.log(e);
  }
};
