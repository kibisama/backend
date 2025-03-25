const alternative = require("../../schemas/alternative");
const package = require("./package");
const getAllHistoricalNDCs = require("../rxnav/getAllHistoricalNDCs");
const getRxcuiHistoryStatus = require("../rxnav/getRxcuiHistoryStatus");
const getAllRelatedInfo = require("../rxnav/getAllRelatedInfo");
const { setOptionParameters } = require("../common");

/**
 * @typedef {alternative.Alternative} Alternative
 * @typedef {typeof alternative.schema.obj} UpdateObj
 * @typedef {package.Package} Package
 */
/**
 * Finds an Alternative document.
 * @param {string} rxcui
 * @returns {Promise<Alternative|undefined>}
 */
const findAlternative = async (rxcui) => {
  try {
    return (await alternative.findOne({ rxcui })) ?? undefined;
  } catch (e) {
    console.log(e);
  }
};
/**
 * Creates an Alternative document.
 * @param {string} rxcui
 * @returns {Promise<Alternative|undefined>}
 */
const createAlternative = async (rxcui) => {
  try {
    return await alternative.create({ rxcui });
  } catch (e) {
    console.log(e);
  }
};
/**
 * Upserts an Alternative document.
 * @param {string} rxcui
 * @param {UpdateOption} option
 * @returns {Promise<Alternative|undefined>}
 */
const upsertAlternative = async (rxcui, option) => {
  try {
    let alt = await findAlternative(rxcui);
    if (!alt) {
      alt = await createAlternative(rxcui);
    }
    updateAlternative(alt, option);
    return alt;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @typedef {object} UpdateOption
 * @property {boolean} force
 */

/**
 * Determines if the Alternative document needs an update.
 * @param {Alternative} alt
 * @returns {{rxNav: boolean}}
 */
const needsUpdate = (alt) => {
  let rxNav = {};
  if (!alt.defaultName) {
    rxNav = true;
  }
  return { rxNav };
};
/**
 * Updates an Alternative document.
 * @param {Alternative} alt
 * @param {UpdateOption} option
 * @returns {Promise<Alternative|undefined>}
 */
const updateAlternative = async (alt, option) => {
  try {
    /** @type {UpdateOption} */
    const defaultOption = { force: false };
    const { force } = setOptionParameters(defaultOption, option);
    /** @type {Parameters<alternative["findOneAndUpdate"]>["1"]} */
    const update = { $set: {} };
    const { rxNav } = force ? { rxNav: true } : needsUpdate(alt);
    if (rxNav) {
      const rxNavData = await updateViaRxNav(rxcui);
      if (rxNavData) {
        Object.assign(update.$set, rxNavData);
      }
    }
    if (Object.keys(update.$set).length) {
      return await alternative.findOneAndUpdate({ _id: alt._id }, update, {
        new: true,
      });
    }
    return alt;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {string} rxcui
 * @returns {Promise<|undefined>}
 */
const updateViaRxNav = async (rxcui) => {
  try {
    const rxcuiStatus = await getRxcuiHistoryStatus(rxcui);
    if (!rxcuiStatus) {
      return;
    }
    /** @type {UpdateObj} */
    const obj = {};
    const { name, tty } = rxcuiStatus.attributes;
    obj.isBranded = tty === "SBD" ? true : false;
    const activeRxcui = getActiveRxcui(rxcui);
    if (!activeRxcui) {
      obj.defaultName = name;
      return obj;
    }
    const allRelatedInfo = await getAllRelatedInfo(activeRxcui);
    if (allRelatedInfo) {
      const { sbd, scd, sbdf, scdf } = allRelatedInfo;
      if (tty === "SBD") {
        obj.defaultName = selectName(sbd);
      } else if (tty === "SCD") {
        obj.defaultName = selectName(scd);
      }
    }
    // (await linkWithFamily(_alt)) || _alt;
    return obj;
  } catch (e) {
    console.log(e);
  }
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

module.exports = { findAlternative, upsertAlternative };
