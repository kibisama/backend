const { Package } = require("../../../schemas/inventory");
const updateLocalNDCDir = require("../../openfda/updateLocalNDCDir");
const getNDCProperties = require("../../rxnav/getNDCProperties");
const findRelatedNDCs = require("../../rxnav/findRelatedNDCs");
const definePackageFields = require("./definePackageFields");
const linkPackageWithAlternative = require("./linkPackageWithAlternative");
const setDefaultPackageName = require("./setDefaultPackageName");

/**
 * updates local NDC Directory & Package documents.
 * @param {Package} package
 * @param {function} callback
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (package, callback) => {
  try {
    const { gtin, ndc11 } = package;
    let arg = "";
    let type = "";
    switch (true) {
      case !!ndc11:
        arg = ndc11;
        type = "ndc11";
        break;
      case !!gtin:
        arg = gtin;
        type = "gtin";
        break;
      default:
        return;
    }
    const ndcDir = await updateLocalNDCDir(arg, type);
    if (!(ndcDir instanceof Error)) {
      query = definePackageFields(arg, type, ndcDir);
    } else {
      const ndcProperties = await getNDCProperties(arg, type);
      if (ndcProperties instanceof Error) {
        return;
      }
      query = ndcProperties;
    }
    const relatedNDCs = await findRelatedNDCs(query.ndc11);
    if (!(relatedNDCs instanceof Error)) {
      const { rxcui, tty } = relatedNDCs;
      query.rxcui = rxcui;
      if (tty === "SBD") {
        query.brand = true;
      } else if (tty === "SCD") {
        query.brand = false;
      }
    }
    let result = await Package.findOneAndUpdate(
      { [type]: arg },
      { $set: query },
      { new: true }
    );
    if (result.rxcui) {
      result = await linkPackageWithAlternative(result);
    }
    result = await setDefaultPackageName(result);
    if (callback instanceof Function) {
      callback(result);
    }
    return result;
  } catch (e) {
    console.log(e);
  }
};
