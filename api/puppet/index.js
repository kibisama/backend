const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = process.env.PUPPET_ADDRESS;

module.exports = {
  cardinal: {
    url: "/cardinal",
    async getProductDetails({ cin, query }) {
      try {
        return await client.post(`${this.url}/getProductDetails`, {
          cin,
          query,
        });
      } catch (e) {
        console.log(e);
        return e;
      }
    },
    async searchProducts({ queries }) {
      try {
        return await client.post(`${this.url}/searchProducts`, { queries });
      } catch (e) {
        console.log(e);
        return e;
      }
    },
  },
  ps: {
    url: "/pharmsaver",
    async getSearchResults({ ndc11, query }) {
      try {
        return await client.post(`${this.url}/getSearchResults`, {
          ndc11,
          query,
        });
      } catch (e) {
        console.log(e);
        return e;
      }
    },
  },
};
