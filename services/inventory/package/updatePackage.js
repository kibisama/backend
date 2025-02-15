const { Package, Alternative } = require("../../../schemas/inventory");
const searchNDCDir = require("../../openfda/searchNDCDir");
const getNDCProperties = require("../../rxnav/getNDCProperties");
const getAllRxTermInfo = require("../../rxnav/getAllRxTermInfo");
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
    const ndcDir = await searchNDCDir(arg, type);
    const query = {};
    let ndcProperties;
    if (!(ndcDir instanceof Error)) {
      Object.assign(query, ndcDir);
      const _ndcProperties = await getNDCProperties(ndcDir.ndc, "ndc");
      if (!(_ndcProperties instanceof Error)) {
        ndcProperties = _ndcProperties;
      }
    } else {
      const _ndcProperties = await getNDCProperties(arg, type);
      if (_ndcProperties instanceof Error) {
        return;
      }
      ndcProperties = _ndcProperties;
    }
    if (ndcProperties) {
      for (const key in ndcProperties) {
        if (!query[key]) {
          query[key] = ndcProperties[key];
        }
      }
      const rxTermInfo = await getAllRxTermInfo(ndcProperties.rxcui);
      if (!(rxTermInfo instanceof Error)) {
        const {
          termType,
          strength,
          brandName,
          rxtermsDoseForm,
          rxnormDoseForm,
          fullName,
          fullGenericName,
        } = rxTermInfo;
        strength && (query.strength = strength);
        if (termType === "SBD") {
          query.brand = true;
          if (brandName && strength && (rxtermsDoseForm || rxnormDoseForm)) {
            query.name = `${brandName} ${strength} ${
              rxtermsDoseForm ? rxtermsDoseForm : rxnormDoseForm
            }${query.size ? ` (${query.size})` : ""}`.toUpperCase();
          }
        } else if (termType === "SCD") {
          query.brand = false;
          if (fullGenericName || fullName) {
            const _name = fullGenericName ? fullGenericName : fullName;
            if (rxtermsDoseForm || rxnormDoseForm) {
              query.name = _name.replace(
                rxnormDoseForm.toUpperCase(),
                rxtermsDoseForm.toUpperCase()
              );
            } else {
              query.name = _name;
            }
          }
        }
      }
    }
    let result = await Package.findOneAndUpdate(
      { [type]: arg },
      { $set: query },
      { new: true }
    );
    if (!result.name) {
      result = await setDefaultPackageName(result);
    }
    if (result.rxcui) {
      result = await linkPackageWithAlternative(result);
      if (query.dea_schedule) {
        await Alternative.findOneAndUpdate(
          { rxcui: result.rxcui },
          { dea_schedule: query.dea_schedule }
        );
      }
    }
    if (callback instanceof Function) {
      callback(result);
    }
    return result;
  } catch (e) {
    console.log(e);
  }
};
