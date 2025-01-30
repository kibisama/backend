const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "https://rxnav.nlm.nih.gov/REST";

const get = async (query) => {
  try {
    return await client.get(query);
  } catch (e) {
    console.log(e);
    return e;
  }
};

module.exports = {
  async getNDCProperties(id) {
    const query = `/ndcproperties.json?id=${id}`;
    return await get(query);
  },
  async getAllRelatedInfo(rxcui) {
    const query = `/rxcui/${rxcui}/allrelated.json`;
    return await get(query);
  },
  async findRelatedNDCs(ndc) {
    const query = `https://rxnav.nlm.nih.gov/REST/relatedndc.json?ndc=${ndc}&relation=drug&ndcstatus=all`;
    return await get(query);
  },
};
