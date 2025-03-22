const rxnav = require("../../api/rxnav");

/**
 * @typedef {object} HistoricalNdcConcept
 * @property {[HistoricalNdcTime]} historicalNdcTime
 * @typedef {object} HistoricalNdcTime
 * @property {"direct"|"indirect"} status
 * @property {string} rxcui
 * @property {[NdcTime]} ndcTime
 * @typedef {object} NdcTime
 * @property {[string]} ndc in CMS 11-digit format (array of 1)
 * @property {string} startDate YYYYMM
 * @property {string} endDate YYYYMM
 */

/**
 * @param {string} arg
 * @param {ArgType} type
 * @returns {Promise<HistoricalNdcConcept|undefined>}
 */
module.exports = async (rxcui) => {
  try {
    const result = await rxnav("getAllHistoricalNDCs", rxcui);
    if (result instanceof Error) {
      return;
    }
    /** @type {HistoricalNdcConcept} */
    const historicalNdcConcept = result.data.historicalNdcConcept;
    if (historicalNdcConcept) {
      return historicalNdcConcept;
    }
  } catch (e) {
    console.log(e);
  }
};
