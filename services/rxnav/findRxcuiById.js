const rxnav = require("../../api/rxnav");
const { gtinToNDC } = require("../convert");

/**
 * @typedef {import("../inventory/package").ArgType} ArgType
 * 
 * @typedef {object} IdGroup
 * @property {[string]} rxnormId
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
 * @returns {Promise<{ndc: string, rxcui: string}|undefined>}
 */
module.exports = async (arg, type) => {
  try {
    const queries = getQueries(arg, type);
    let rxcui = "";
    let ndc = "";
    for (let i = 0; i < queries.length; i++) {
      const _ndc = queries[i];
      const result = await rxnav("findRxcuiById", _ndc);
      if (result instanceof Error) {
        continue;
      }
      /** @type {IdGroup|undefined} */
      const idGroup = result.data.idGroup;
      const rxnormId = idGroup?.rxnormId;
      if (rxnormId) {
        if (!ndc) {
          ndc = _ndc;
          rxcui = rxnormId[0];
        } else {
          return;
        }
      }
    }
    if (!rxcui) {
      return;
    }
    return { ndc, rxcui };
  } catch (e) {
    console.log(e);
  }
};
