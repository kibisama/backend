const alternative = require("../../schemas/inv/alternative");
const family = require("./family");
const getRxcuiHistoryStatus = require("../rxnav/getRxcuiHistoryStatus");
const getAllRelatedInfo = require("../rxnav/getAllRelatedInfo");
const { isAfterTodayStart } = require("../common");
/**
 * @typedef {import("mongoose").ObjectId} ObjectId
 * @typedef {alternative.Alternative} Alternative
 * @typedef {import("./package").Package} Package
 */

/**
 * Upserts an Alternative document.
 * @param {string} rxcui
 * @param {UpdateOption} option
 * @returns {Promise<Alternative|undefined>}
 */
exports.upsertAlternative = async (rxcui, option = {}) => {
  try {
    const { force, callback } = option;
    const alt = await alternative.findOneAndUpdate(
      { rxcui },
      {},
      { new: true, upsert: true }
    );
    exports.updateAlternative(alt, {
      force,
      callback: (refreshedAlt) => {
        exports.getAllDocuments(true);
        if (callback instanceof Function) {
          return callback(refreshedAlt);
        }
      },
    });
    return alt;
  } catch (e) {
    console.error(e);
  }
};

/**
 * Refreshes a Alternative documnet.
 * @param {Alternative|ObjectId} alt
 * @returns {Promise<Alternative|undefined>}
 */
exports.refreshAlternative = async (alt) => {
  try {
    return await alternative.findById(alt);
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
 * @returns {Promise<any>}
 */
exports.updateAlternative = async (alt, option = {}) => {
  try {
    const { force, callback } = option;
    const { defaultName, isBranded: _isBranded, genAlt, family, rxcui } = alt;

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
      await alt.updateOne(update);
      if (callback instanceof Function) {
        return callback(exports.refreshAlternative(alt));
      }
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
      await alt.updateOne({ $set: { genAlt } });
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
      return await alt.updateOne({ $set: { family: fm } });
    }
  } catch (e) {
    console.error(e);
  }
};

/** Caching sortedAllDocuments **/
let __allDocuments;
exports.getAllDocuments = async (refresh) => {
  try {
    if (refresh || !__allDocuments) {
      __allDocuments = await alternative
        .find()
        .sort({ name: 1, defaultName: 1 });
    }
    return __allDocuments;
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string|ObjectId} _id
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
