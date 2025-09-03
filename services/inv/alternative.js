const alternative = require("../../schemas/inv/alternative");
const family = require("./family");
const getRxcuiHistoryStatus = require("../rxnav/getRxcuiHistoryStatus");
const getAllRelatedInfo = require("../rxnav/getAllRelatedInfo");
/**
 * @typedef {import("mongoose").ObjectId} ObjectId
 * @typedef {alternative.Alternative} Alternative
 * @typedef {import("./package").Package} Package
 */

/**
 * Upserts an Alternative document.
 * @param {string} rxcui
 * @returns {Promise<Alternative|undefined>}
 */
exports.upsertAlternative = async (rxcui) => {
  try {
    const alt = await alternative.findOneAndUpdate(
      { rxcui },
      {},
      { new: true, upsert: true }
    );
    exports.updateAlternative(alt, {
      callback: () => exports.getAllDocuments(true),
    });
    return alt;
  } catch (e) {
    console.error(e);
  }
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} [force]
 * @property {Function} [callback]
 */

/**
 * Updates an Alternative document.
 * @param {Alternative} alt
 * @returns {Promise<Awaited<ReturnType<Alternative["updateOne"]>>|undefined>}
 */
exports.updateAlternative = async (alt, option = {}) => {
  try {
    const { force, callback } = option;
    const {
      defaultName,
      isBranded: _isBranded,
      genAlt,
      family,
      rxcui,
      cahProduct,
    } = alt;
    if (!cahProduct) {
      //
    }
    if (force || _isBranded == undefined || !family || !defaultName) {
      const rxcuiStatus = await getRxcuiHistoryStatus(rxcui);
      if (!rxcuiStatus) {
        return;
      }
      /** @type {Parameters<alternative["findOneAndUpdate"]>["1"]} */
      const update = { $set: {} };
      const { attributes, scdConcept } = rxcuiStatus;
      if (scdConcept && (force || !genAlt)) {
        await updateGenAlt(alt, scdConcept.scdConceptRxcui);
      }
      const { name, tty } = attributes;
      update.$set.isBranded = isBranded(tty);
      const activeRxcui = getActiveRxcui(rxcuiStatus);
      if (!activeRxcui) {
        update.$set.defaultName = name;
        return await alt.updateOne(update);
      }
      const allRelatedInfo = await getAllRelatedInfo(activeRxcui);
      if (allRelatedInfo) {
        const { sbd, scd, bpck, gpck, scdf } = allRelatedInfo;
        if (sbd && tty === "SBD") {
          update.$set.defaultName = selectName(sbd[0]);
        } else if (scd && tty === "SCD") {
          update.$set.defaultName = selectName(scd[0]);
        } else if (bpck && tty === "BPCK") {
          if (gpck && (force || !genAlt)) {
            await updateGenAlt(alt, gpck[0].rxcui);
          }
          update.$set.defaultName = selectName(bpck[0]);
        } else if (gpck && tty === "GPCK") {
          update.$set.defaultName = selectName(gpck[0]);
        }
        if (scdf) {
          await linkWithFamily(alt, scdf[0].rxcui);
        }
      }
      callback instanceof Function && callback(await refreshPackage(_pkg));
      return await alt.updateOne(update);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {import("../../api/rxnav").TermType} tty
 * @returns {boolean}
 */
const isBranded = (tty) => {
  if (!tty) {
    return;
  }
  if (tty === "SBD" || tty === "BPCK") {
    return true;
  }
  return false;
};
/**
 * @param {getRxcuiHistoryStatus.Output} rxcuiStatus
 * @returns {string|undefined}
 */
const getActiveRxcui = (rxcuiStatus) => {
  const { status, attributes, remappedConcept, quantifiedConcept } =
    rxcuiStatus;
  const { rxcui, tty } = attributes;
  let _rxcui = 0;
  switch (status) {
    case "Active":
      return rxcui;
    case "Remapped":
      for (let i = 0; i < remappedConcept.length; i++) {
        const { remappedActive, remappedTTY, remappedRxCui } =
          remappedConcept[i];
        if (remappedActive === "YES") {
          if (tty === remappedTTY) {
            return remappedRxCui;
          }
          const number = Number(remappedRxCui);
          if (number > _rxcui) {
            _rxcui = number;
          }
        }
      }
      break;
    case "Quantified":
      for (let i = 0; i < quantifiedConcept.length; i++) {
        const { quantifiedActive, quantifiedTTY, quantifiedRxcui } =
          quantifiedConcept[i];
        if (quantifiedActive === "YES") {
          if (tty === quantifiedTTY) {
            return quantifiedRxcui;
          }
          const number = Number(quantifiedRxcui);
          if (number > _rxcui) {
            _rxcui = number;
          }
        }
      }
      break;
    default:
  }
  if (_rxcui) {
    return _rxcui.toString;
  }
};

/**
 * @param {Alternative} alt
 * @param {string} rxcui
 * @returns {Promise<undefined>}
 */
const updateGenAlt = async (alt, rxcui) => {
  try {
    const genAlt = await exports.upsertAlternative(rxcui);
    if (genAlt) {
      await alt.updateOne({ $set: { genAlt: genAlt._id } });
    }
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {getAllRelatedInfo.ConceptProperties} conceptProperties
 * @returns {string|undefined}
 */
const selectName = (conceptProperties) => {
  const { name, synonym, psn } = conceptProperties;
  if (psn) {
    return psn;
  }
  if (synonym) {
    return synonym;
  }
  return name;
};
/**
 * @param {Alternative} alt
 * @returns {Promise<Awaited<ReturnType<Alternative["updateOne"]>>|undefined>}
 */
const linkWithFamily = async (alt, scdf) => {
  try {
    const { _id, family: _family, rxcui } = alt;
    const fm = await family.upsertFamily(scdf);
    if (fm && !_family?.equals(fm._id)) {
      await fm.updateOne({ $addToSet: { alternatives: _id, rxcui } });
      return await alt.updateOne({ $set: { family: fm._id } });
    }
  } catch (e) {
    console.error(e);
  }
};

/** Caching sortedAllDocuments **/
let allDocuments;
exports.getAllDocuments = async (refresh) => {
  try {
    if (refresh || !allDocuments) {
      allDocuments = await alternative.find().sort({ name: 1, defaultName: 1 });
    }
    return allDocuments;
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {ObjectId} _id
 * @returns {Promise<[Package]|undefined>}
 */
exports.getPackagesWithInventories = async (_id) => {
  try {
    const result = await alternative.findById(
      _id,
      { packages: true },
      {
        populate: {
          path: "packages",
          populate: {
            path: "inventories",
          },
        },
      }
    );
    if (result?.packages) {
      return result.packages;
    }
  } catch (e) {
    console.error(e);
  }
};

// /**
//  * @param {ObjectId} alt
//  * @param {ObjectId} cahProduct
//  * @returns {Promise<undefined>}
//  */
// const setCAHProduct = async (alt, cahProduct) => {
//   try {
//     await alternative.findByIdAndUpdate(alt, { $set: { cahProduct } });
//   } catch (e) {
//     console.log(e);
//   }
// };
