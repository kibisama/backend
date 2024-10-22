const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "https://api.fda.gov";

module.exports = {
  ndc: {
    url: "/drug/ndc.json",
    async searchOneByPackageDescription(_query) {
      const query = `${this.url}?search=packaging.description:${_query}&limit=1`;
      try {
        return await client.get(query);
      } catch (e) {
        console.log(e);
      }
    },
  },
};
