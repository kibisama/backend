const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "https://rxnav.nlm.nih.gov/REST";

module.exports = {
  async getNdcProperties(ndc) {
    const query = `/ndcproperties.json?id=${ndc}`;
    try {
      return await client.get(query);
    } catch (e) {
      console.log(e);
      return e;
    }
  },
  async getAllRelatedInfo(rxcui) {
    const query = `/rxcui/${rxcui}/allrelated.json`;
    try {
      return await client.get(query);
    } catch (e) {
      console.log(e);
      return e;
    }
  },
};
