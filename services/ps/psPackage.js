const PsPackage = require("../../schemas/ps/psPackage");
const { isAfterTodayStart, isShortDated: _isShortDated } = require("../common");
const { stringToNumber, ndcToCMSNDC11 } = require("../convert");
const getSearchResults = require("./getSearchResults");
const {
  updatePsPackageCallback: updatePsAlternative,
} = require("./psAlternative");

/**
 * @typedef {import("mongoose").ObjectId} ObjectId
 * @typedef {import(import("../../schemas/ps/psAlternative").Result)} Result
 * @typedef {PsPackage.PsPackage} PsPackage
 * @typedef {import("../inv/package").Package} Package
 * @typedef {Parameters<PsPackage["findOneAndUpdate"]>["0"]} Filter
 * @typedef {Parameters<PsPackage["findOneAndUpdate"]>["1"]} UpdateParam
 */
/**
 * @param {Package|ObjectId} package
 * @returns {Promise<PsPackage|undefined>}
 */
exports.upsertPsPackage = async (package) => {
  try {
    const psPkg = await PsPackage.findOneAndUpdate(
      { package },
      {},
      { new: true, upsert: true }
    );
    exports.updatePsPackage(psPkg);
    return psPkg;
  } catch (e) {
    console.error(e);
  }
};
/**
 * Refreshes a PsPackage documnet.
 * @param {PsPackage|ObjectId} psPkg
 * @returns {Promise<PsPackage|undefined>}
 */
exports.refreshPsPackage = async (psPkg) => {
  try {
    return await PsPackage.findById(psPkg);
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {PsPackage} psPkg
 * @returns {boolean}
 */
const needsUpdate = (psPkg) => {
  const { lastRequested } = psPkg;
  if (!lastRequested || !isAfterTodayStart(lastRequested)) {
    return true;
  }
  return false;
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} [force]
 * @property {Function} [callback]
 */

/**
 * Request a puppet to update a PsPackage.
 * @param {PsPackage} psPkg
 * @param {UpdateOption} option
 * @returns {void}
 */
exports.updatePsPackage = async (psPkg, option = {}) => {
  try {
    (option.force || needsUpdate(psPkg)) &&
      getSearchResults(psPkg, (data, psPkg) =>
        updatePsPackageCallback(data, psPkg, option)
      ) &&
      (await psPkg.updateOne({ $set: { lastRequested: new Date() } }));
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {getProductDetails.Data|null} data
 * @param {PsPackage} _psPkg
 * @param {UpdateOption} option
 * @returns {void}
 */
const updatePsPackageCallback = async (data, _psPkg, option) => {
  const { callback } = option;
  try {
    const psPkg = await exports.refreshPsPackage(_psPkg);
    await psPkg.populate({
      path: "package",
      populate: { path: "alternative", populate: "psAlternative" },
    });
    const { package } = psPkg;
    const { ndc11, ndc, alternative } = package;
    if (data == null) {
      const updateParam = {
        $set: { lastUpdated: new Date(), active: false },
      };
      await psPkg.updateOne(updateParam);
      if (alternative) {
        const { psAlternative } = alternative;
        psAlternative && (await psAlternative.updateOne(updateParam));
      }
      /** Refreshing  __invUsageToday **/
      const { getUsages } = require("../inv/inventory");
      getUsages(undefined, true);
      return;
    }
    /** @type {import("./getSearchResults").Data} **/
    const { inputValue, results } = data.data;
    const cms = ndc11 ? ndc11.replaceAll("-", "") : ndcToCMSNDC11(ndc);
    if (inputValue && inputValue !== cms) {
      return;
    }
    suffixDescription(results);
    const { item, items } = filterResult(results, cms);
    if (item) {
      await psPkg.updateOne({
        $set: { lastUpdated: new Date(), active: true, ...item },
      });
    } else {
      await psPkg.updateOne({
        $set: { lastUpdated: new Date(), active: false },
      });
    }
    if (alternative) {
      const { psAlternative } = alternative;
      psAlternative && (await updatePsAlternative(psAlternative, items));
    }
    /** Refreshing  __invUsageToday **/
    const { getUsages } = require("../inv/inventory");
    getUsages(undefined, true);
    callback instanceof Function &&
      callback(await exports.refreshPsPackage(psPkg));
  } catch (e) {
    console.error(e);
  }
};
/**
 * Modifies each original result object.
 * @param {[Result]} results
 * @returns {undefined}
 */
const suffixDescription = (results) => {
  results.forEach((v) => {
    const suffix = ` ${v.str} ${v.form} (${v.pkg})`;
    if (!v.description.endsWith(suffix)) {
      v.description += suffix;
    }
  });
};
/**
 * @param {string} lotExpDate
 * @returns {boolean}
 */
const isShortDated = (lotExpDate) => {
  return _isShortDated(lotExpDate, "MM/YY");
};
/**
 * @param {[Result]} results
 * @param {string} cms
 * @returns {{item: Result|undefined, items: [Result]}}
 */
const filterResult = (results, cms) => {
  /** @type {Result|undefined} */
  let cheapestSameNdc;
  /** @type {Result|undefined} */
  let cheapestSameNdcShort;
  const table = {};
  results.forEach((v) => {
    const { description, unitPrice, ndc, lotExpDate } = v;
    if (!table[description]) {
      table[description] = v;
    } else if (
      stringToNumber(table[description].unitPrice) > stringToNumber(unitPrice)
    ) {
      table[description] = v;
    }
    if (ndc === cms) {
      if (isShortDated(lotExpDate)) {
        if (!cheapestSameNdcShort) {
          cheapestSameNdcShort = v;
        } else if (
          stringToNumber(cheapestSameNdcShort.unitPrice) >
          stringToNumber(unitPrice)
        ) {
          cheapestSameNdcShort = v;
        }
      } else {
        if (!cheapestSameNdc) {
          cheapestSameNdc = v;
        } else if (
          stringToNumber(cheapestSameNdc.unitPrice) > stringToNumber(unitPrice)
        ) {
          cheapestSameNdc = v;
        }
      }
    }
  });
  const items = [];
  for (const prop in table) {
    items.push(table[prop]);
  }
  return { item: cheapestSameNdc || cheapestSameNdcShort, items };
};
