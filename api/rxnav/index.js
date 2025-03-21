const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "https://rxnav.nlm.nih.gov/REST";

/**
 * @param {"getNDCStatus"|"getNDCProperties|"getRxcuiHistoryStatus"} method
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
        _query = `ndcproperties.json?id=${query}`;
        break;
      case "getRxcuiHistoryStatus":
        _query = `rxcui/${query}/historystatus.json`;
        break;
      default:
    }
    return await client.get(_query);
  } catch (e) {
    console.log(e);
    return e;
  }
};
