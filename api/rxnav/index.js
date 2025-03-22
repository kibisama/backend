const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "https://rxnav.nlm.nih.gov/REST";

/**
 * @param {"getNDCStatus"|"getNDCProperties"|"getAllHistoricalNDCs"} method
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
      case "getAllHistoricalNDCs":
        _query = `rxcui/${query}/allhistoricalndcs.json`;
        break;
      case "getAllRelatedInfo":
        _query = `rxcui/${query}/allrelated.json?expand=psn`;
        break;
      default:
    }
    return await client.get(_query);
  } catch (e) {
    console.log(e);
    return e;
  }
};
