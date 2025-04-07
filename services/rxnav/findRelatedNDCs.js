const rxnav = require("../../api/rxnav");

/**
 * @typedef {object} NdcInfoList
 * @property {[NdcInfo]} ndcInfo
 * @typedef {object} NdcInfo
 * @property {string} ndc11 cms
 * @property {rxnav.NdcStatus} status
 * @property {string} rxcui
 * @property {string} conceptName
 * @property {rxnav.TermType} tty
 */

/**
 * @param {string} ndc
 * @returns {Promise<|undefined>}
 */
module.exports = async (ndc) => {
  try {
    const result = await rxnav("findRelatedNDCs", ndc);
    if (result instanceof Error) {
      return;
    }
    /** @type {NdcInfoList|undefined} */
    const ndcInfoList = result.data.ndcInfoList;
    if (ndcInfoList) {
      return ndcInfoList;
    }
  } catch (e) {
    console.log(e);
  }
};
