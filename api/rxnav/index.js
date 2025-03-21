const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "https://rxnav.nlm.nih.gov/REST";

/**
 * @param {"findRxcuiById"} method
 * @param {string} query
 * @returns {Promise<any|Error>}
 */
module.exports = async (method, query) => {
  try {
    let _query = "";
    switch (method) {
      case "findRxcuiById":
        _query = `rxcui.json?idtype=NDC&id=${query}`;
        break;
      default:
    }
    return await client.get(_query);
  } catch (e) {
    console.log(e);
    return e;
  }
};
