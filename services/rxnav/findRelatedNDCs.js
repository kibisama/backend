const rxnav = require("../../api/rxnav");
const { hyphenateNDC11 } = require("../convert");

/**
 * @typedef {object} NdcInfoList
 * @property {[NdcInfo]} ndcInfo
 * @typedef {object} NdcInfo
 * @property {string} ndc11 CMS
 * @property {rxnav.NdcStatus} status
 * @property {string} rxcui
 * @property {string} conceptName
 * @property {rxnav.TermType} tty
 */

/**
 * @param {string} ndc
 * @returns {Promise<[string]|undefined>}
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
      const ndcInfo = ndcInfoList.ndcInfo;
      if (ndcInfo.length > 0) {
        return ndcInfo.map((v) => hyphenateNDC11(v.ndc11));
      }
    }
  } catch (e) {
    console.log(e);
  }
};
