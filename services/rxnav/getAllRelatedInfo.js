const rxnav = require("../../api/rxnav");

/**
 * @typedef {object}
 */

/**
 * @param {string} arg
 * @param {ArgType} type
 * @returns {Promise<HistoricalNdcConcept|undefined>}
 */
module.exports = async (rxcui) => {
  try {
    //   const result = await rxnav("getAllHistoricalNDCs", rxcui);
    //   if (result instanceof Error) {
    //     return;
    //   }
    //   /** @type {HistoricalNdcConcept} */
    //   const historicalNdcConcept = result.data.historicalNdcConcept;
    //   if (historicalNdcConcept) {
    //     return historicalNdcConcept;
    //   }
  } catch (e) {
    console.log(e);
  }
};
