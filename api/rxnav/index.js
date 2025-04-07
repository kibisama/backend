const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "https://rxnav.nlm.nih.gov/REST";

/**
 * https://rxnav.nlm.nih.gov/REST/termtypes.json
 * @typedef {"BN"|"BPCK"|"DF"|"DFG"|"GPCK"|"IN"|"MIN"|"PIN"|"SBD"|"SBDC"|"SBDF"|"SBDFP"|"SBDG"|"SCD"|"SCDC"|"SCDF"|"SCDFP"|"SCDG"|"SCDGP"} TermType
 * @typedef {"ACTIVE"|"OBSOLETE"|"ALIEN"|"UNKNOWN"} NdcStatus
 * @typedef {"Active"|"Obsolete"|"Remapped"|"Quantified"|"NotCurrent"|"Unknown"} ConceptStatus
 * @typedef {"DCSA"|"LABELER"|"LABEL_TYPE"|"MARKETING_EFFECTIVE_TIME_HIGH"|"MARKETING_EFFECTIVE_TIME_LOW"|"MARKETING_STATUS"|"SHAPETEXT"|"SIZE"|"COLORTEXT"|"IMPRINT_CODE"} PropertyName
 */

/**
 * @param {"getNDCStatus"|"getNDCProperties"|"findRelatedNDCs"|"getAllHistoricalNDCs"|"getRxcuiHistoryStatus"|"getAllRelatedInfo"|"getTermTypes"} method
 * @param {string} query
 * @returns {Promise<any|Error>}
 */
module.exports = async (method, query) => {
  try {
    let _query = "";
    switch (method) {
      case "getNDCStatus":
        _query = `ndcstatus.json?ndc=${query}`;
        break;
      case "getNDCProperties":
        _query = `ndcproperties.json?id=${query}&ndcstatus=ALL`;
        break;
      case "findRelatedNDCs":
        _query = `relatedndc.json?ndc=${query}&relation=concept`;
        break;
      case "getAllHistoricalNDCs":
        _query = `rxcui/${query}/allhistoricalndcs.json`;
        break;
      case "getRxcuiHistoryStatus":
        _query = `rxcui/${query}/historystatus.json`;
        break;
      case "getAllRelatedInfo":
        _query = `rxcui/${query}/allrelated.json?expand=psn`;
        break;
      case "getTermTypes":
        _query = "termtypes.json";
        break;
      default:
    }
    return await client.get(_query);
  } catch (e) {
    console.log(e);
    return e;
  }
};
