const rxnav = require("../../api/rxnav");
const { gtinToNDC } = require("../convert");

/**
 * @typedef {import("../inv/package").ArgType} ArgType
 * 
 * @typedef {"ACTIVE"|"OBSOLETE"|"ALIEN"|"UNKNOWN"} Status
 * @typedef {object} NdcStatus
 * @property {string} ndc11
 * @property {rxnav.NdcStatus} status
 * @property {string} rxcui
 * @typedef {{ndc: string, rxcui: string, status: rxnav.NdcStatus}} Output
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
    let rxcui = "";
    let ndc = "";
    let status = "";
    for (let i = 0; i < queries.length; i++) {
      const _ndc = queries[i];
      const result = await rxnav("getNDCStatus", _ndc);
      if (result instanceof Error) {
        continue;
      }
      /** @type {NdcStatus} */
      const ndcStatus = result.data.ndcStatus;
      const _status = ndcStatus.status;
      if (_status !== "UNKNOWN") {
        if (!ndc) {
          ndc = _ndc;
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
    return { ndc, rxcui, status };
  } catch (e) {
    console.log(e);
  }
};
