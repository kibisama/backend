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
// /**
//  * Finds related Alternative documents.
//  * @param {string} rxcui
//  * @returns {Promise<Alternative|Error|undefined>}
//  */
// const findRelatedAlts = async (rxcui) => {
//   try {
//     const rxcui = [];
//     const oldRxcui = await findOldRxcui(rxcui);
//     if (oldRxcui) {
//       oldRxcui.forEach((v) => rxcui.push(v));
//     }
//     // const newRxcui = await findNewRxcui(rxcui);
//     // if (newRxcui) {
//     //   newRxcui.forEach((v) => rxcui.push(v));
//     // }
//     if (rxcui.length === 0) {
//       return new Error();
//     }
//     return (await alternative.findOne({ rxcui: { $in: rxcui } })) ?? undefined;
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {string} rxcui
//  * @returns {Promise<[string]|undefined>}
//  */
// const findOldRxcui = async (rxcui) => {
//   try {
//     const historicalNdcConcept = await getAllHistoricalNDCs(rxcui);
//     if (historicalNdcConcept) {
//       const oldRxcui = [];
//       historicalNdcConcept.historicalNdcTime.forEach((v) => {
//         oldRxcui.push(v.rxcui);
//       });
//       return oldRxcui;
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };
// /**
//  * @param {string} rxcui
//  * @returns {Promise<[string]|undefined>}
//  */
// const findNewRxcui = async (rxcui) => {
//   try {
//     const output = await getRxcuiHistoryStatus(rxcui);
//     if (output && Object.keys(output).length > 2) {
//       const newRxcui = [];
//       const { quantifiedConcept, remappedConcept, scdConcept, qdFreeConcept } =
//         output;
//       if (quantifiedConcept) {
//         quantifiedConcept.forEach((v) => newRxcui.push(v.quantifiedRxcui));
//       }
//       if (remappedConcept?.length === 1) {
//         newRxcui.push(remappedConcept[0].remappedRxCui);
//       }
//       if (scdConcept) {
//         newRxcui.push(scdConcept.scdConceptRxcui);
//       }
//       return newRxcui;
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };
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
 * @returns {{rxNav: {}}}
 */
const needsUpdate = (alt) => {
  // let rxNav = {};
  // if (!alt.genericName || !alt.brandName) {
  //   // rxNav = true;
  // }
  // return { rxNav };
};
/**
 * Updates an Alternative document.
 * @param {Alternative} alt
 * @param {UpdateOption} option
 * @returns {Promise<Alternative|undefined>}
 */
const updateAlternative = async (alt, option) => {
  try {
    let _alt = alt;
    const rxcui = selectRxcui(_alt);
    /** @type {UpdateOption} */
    const defaultOption = { force: false };
    const { force } = setOptionParameters(defaultOption, option);
    /** @type {Parameters<alternative["findOneAndUpdate"]>["1"]} */
    const update = { $set: {} };
    //   const { rxNav } = force ? { rxNav: true } : needsUpdate(_alt);
    //   if (rxNav) {
    //     const rxNavData = await updateViaRxNav(rxcui);
    //     if (rxNavData) {
    //       Object.assign(update.$set, rxNavData);
    //     }
    //   }
    //   if (Object.keys(update.$set).length) {
    //      return await alternative.findOneAndUpdate({ _id: _alt._id }, update, {
    //       new: true,
    //     });
    //   }
    //
  } catch (e) {
    console.log(e);
  }
};
/**
 * @param {Alternative} alt
 * @returns {string}
 */
const selectRxcui = (alt) => {
  // const rxcui = alt.rxcui;
  // let _rxcui = 0;
  // for (let i = 0; i < rxcui.length; i++) {
  //   const number = Number(rxcui[i]);
  //   if (number > _rxcui) {
  //     _rxcui = number;
  //   }
  // }
  // return _rxcui.toString();
};
/**
 * @param {string} rxcui
 * @returns {Promise<|undefined>}
 */
const updateViaRxNav = async (rxcui) => {
  try {
    const rxcuiStatus = await getRxcuiHistoryStatus(rxcui);
    if (!rxcuiStatus || rxcuiStatus.status !== "Active") {
      return;
    }
    /** @type {UpdateObj} */
    const obj = {};
    const allRelatedInfo = await getAllRelatedInfo(rxcui);
    if (allRelatedInfo) {
      const { sbd, scd, sbdf, scdf } = allRelatedInfo;
      if (sbd) {
        obj.brandName = selectName(sbd);
      }
      if (scd) {
        obj.genericName = selectName(scd);
      }
    }
    // (await linkWithFamily(_alt)) || _alt;
    return obj;
  } catch (e) {
    console.log(e);
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
