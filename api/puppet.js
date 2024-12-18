const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "http://localhost:3002";

module.exports = {
  cardinal: {
    url: "/cardinal",
    // async getInvoice(date) {
    //   try {
    //     return await client.post(`${this.url}/getInvoice`, date);
    //   } catch (e) {
    //     console.log(e);
    //     return e;
    //   }
    // },
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
  },
  ps: {
    url: "/pharmsaver",
    async getSearchResults(ndc11) {
      try {
        return await client.post(`${this.url}/getSearchResults`, { ndc11 });
      } catch (e) {
        console.log(e);
        return e;
      }
    },
  },
};
