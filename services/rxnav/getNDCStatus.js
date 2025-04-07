const rxnav = require("../../api/rxnav");
const { gtinToNDC, hyphenateNDC11 } = require("../convert");

/**
 * @typedef {import("../inv/package").ArgType} ArgType
 *
 * @typedef {"ACTIVE"|"OBSOLETE"|"ALIEN"|"UNKNOWN"} Status
 * @typedef {object} NdcStatus
 * @property {string} ndc11
 * @property {rxnav.NdcStatus} status
 * @property {string} rxcui
 * @typedef {object} Output
 * @property {string} [ndc]
 * @property {string} rxcui
 * @property {rxnav.NdcStatus} status
 * @property {string} ndc11
 */

/**
 * @param {string} arg
 * @param {ArgType} type
 * @returns {Array}
 */
const getQueries = (arg, type) => {
  let queries = [];
  switch (type) {
    case "ndc":
      queries[0] = arg;
      break;
    case "ndc11":
      queries[0] = arg;
      break;
    case "gtin":
      queries = gtinToNDC(arg);
      break;
    default:
  }
  return queries;
};
/**
 * @param {string} arg
 * @param {ArgType} type
 * @returns {Promise<Output|undefined>}
 */
module.exports = async (arg, type) => {
  try {
    const queries = getQueries(arg, type);
    let query = "";
    let rxcui = "";
    let status = "";
    let ndc11 = "";
    for (let i = 0; i < queries.length; i++) {
      const _query = queries[i];
      const result = await rxnav("getNDCStatus", _query);
      if (result instanceof Error) {
        continue;
      }
      /** @type {NdcStatus} */
      const ndcStatus = result.data.ndcStatus;
      const _status = ndcStatus.status;
      if (_status !== "UNKNOWN") {
        if (!query) {
          query = _query;
          ndc11 = ndcStatus.ndc11;
          rxcui = ndcStatus.rxcui;
          status = _status;
        } else {
          return;
        }
      }
    }
    if (!rxcui) {
      return;
    }
    /** @type {Output} */
    const output = { rxcui, status, ndc11: hyphenateNDC11(ndc11) };
    if (type === "gtin" || type === "ndc") {
      output.ndc = query;
    }
    return output;
  } catch (e) {
    console.log(e);
  }
};
