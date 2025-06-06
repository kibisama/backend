const alternative = require("../../schemas/alternative");
const family = require("./family");
const getRxcuiHistoryStatus = require("../rxnav/getRxcuiHistoryStatus");
const getAllRelatedInfo = require("../rxnav/getAllRelatedInfo");
const { setOptionParameters } = require("../common");

/**
 * @typedef {import("mongoose").ObjectId} ObjectId
 * @typedef {alternative.Alternative} Alternative
 * @typedef {typeof alternative.schema.obj} UpdateObj
 * @typedef {import("./package").Package} Package
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
 * @param {UpdateOption} [option]
 * @returns {Promise<Alternative|undefined>}
 */
const upsertAlternative = async (rxcui, option) => {
  try {
    let alt = await findAlternative(rxcui);
    if (!alt) {
      alt = await createAlternative(rxcui);
    }
    if (alt) {
      updateAlternative(alt, option);
    }
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
  let rxNav = false;
  if (!alt.defaultName) {
    rxNav = true;
  }
  return { rxNav };
};
/**
 * Updates an Alternative document.
 * @param {Alternative} alt
 * @param {UpdateOption} [option]
 * @returns {Promise<Alternative|undefined>}
 */
const updateAlternative = async (alt, option) => {
  try {
    let _alt = alt;
    /** @type {UpdateOption} */
    const defaultOption = { force: false };
    const { force } = setOptionParameters(defaultOption, option);
    /** @type {Parameters<alternative["findOneAndUpdate"]>["1"]} */
    const update = { $set: {} };
    const { rxNav } = force ? { rxNav: true } : needsUpdate(_alt);
    if (rxNav) {
      const rxNavData = await updateViaRxNav(_alt);
      if (rxNavData) {
        Object.assign(update.$set, rxNavData);
      }
    }
    if (Object.keys(update.$set).length) {
      _alt = await alternative.findOneAndUpdate({ _id: _alt._id }, update, {
        new: true,
      });
    }
    return (await linkWithFamily(_alt)) ?? _alt;
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {import("../../api/rxnav").TermType} tty
 * @returns {boolean}
 */
const isBranded = (tty) => {
  if (tty === "SBD" || tty === "BPCK") {
    return true;
  }
  return false;
};

/**
 * @param {Alternative} alt
 * @returns {Promise<UpdateObj|undefined>}
 */
const updateViaRxNav = async (alt) => {
  try {
    const { rxcui } = alt;
    const rxcuiStatus = await getRxcuiHistoryStatus(rxcui);
    if (!rxcuiStatus) {
      return;
    }
    /** @type {UpdateObj} */
    const obj = {};
    const { attributes, scdConcept } = rxcuiStatus;
    if (scdConcept) {
      await setGenAlt(alt, scdConcept.scdConceptRxcui);
    }
    const { name, tty } = attributes;
    obj.isBranded = isBranded(tty);
    const activeRxcui = getActiveRxcui(rxcuiStatus);
    if (!activeRxcui) {
      obj.defaultName = name;
      return obj;
    }
    const allRelatedInfo = await getAllRelatedInfo(activeRxcui);
    if (allRelatedInfo) {
      const { sbd, scd, bpck, gpck, scdf } = allRelatedInfo;
      if (sbd && tty === "SBD") {
        obj.defaultName = selectName(sbd[0]);
      } else if (scd && tty === "SCD") {
        obj.defaultName = selectName(scd[0]);
      } else if (bpck && tty === "BPCK") {
        if (gpck) {
          await setGenAlt(alt, gpck[0].rxcui);
        }
        obj.defaultName = selectName(bpck[0]);
      } else if (gpck && tty === "GPCK") {
        obj.defaultName = selectName(gpck[0]);
      }
      if (scdf) {
        const fm = await family.upsertFamily(scdf[0].rxcui);
        await fm.updateOne({ $addToSet: { rxcui } });
      }
    }
    return obj;
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Alternative} alt
 * @param {string} rxcui
 * @returns {Promise<undefined>}
 */
const setGenAlt = async (alt, rxcui) => {
  try {
    const genAlt = await upsertAlternative(rxcui);
    if (genAlt) {
      await alt.updateOne({ $set: { genAlt: genAlt._id } });
    }
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
/**
 * This will not upsert a Family document.
 * @param {Alternative} alt
 * @returns {Promise<Alternative|undefined>}
 */
const linkWithFamily = async (alt) => {
  try {
    const { _id, rxcui } = alt;
    const fm = await family.searchFamily({ rxcui });
    if (fm?.length > 0) {
      const _fm = fm[0];
      if (!alt.family?.equals(_fm._id)) {
        await _fm.updateOne({ $addToSet: { alternatives: _id } });
        return await alternative.findOneAndUpdate(
          { _id },
          { family: _fm._id },
          { new: true }
        );
      }
    }
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {ObjectId} alt
 * @param {ObjectId} cahProduct
 * @returns {Promise<undefined>}
 */
const setCAHProduct = async (alt, cahProduct) => {
  try {
    await alternative.findByIdAndUpdate(alt, { $set: { cahProduct } });
  } catch (e) {
    console.log(e);
  }
};

module.exports = { findAlternative, upsertAlternative, setCAHProduct };
