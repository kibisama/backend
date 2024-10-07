const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "https://api.fda.gov";

module.exports = {
  ndc: {
    url: "/drug/ndc.json",
    async searchOneByPackageNdc(ndc) {
      const query = `${this.url}?search=packaging.package_ndc:${ndc}&limit=1`;
      try {
        return await client.get(query);
      } catch (e) {
        console.log(e);
        return;
      }
    },
  },
};
