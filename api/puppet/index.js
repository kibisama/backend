const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = process.env.PUPPET_ADDRESS;

module.exports = {
  cardinal: {
    url: "/cardinal",
    async getProductDetails(body) {
      try {
        return await client.post(`${this.url}/getProductDetails`, body);
      } catch (e) {
        console.log(e);
        return e;
      }
    },
    async searchProducts(body) {
      try {
        return await client.post(`${this.url}/searchProducts`, body);
      } catch (e) {
        console.log(e);
        return e;
      }
    },
    async getDSCSAData(body) {
      try {
        return await client.post(`${this.url}/getDSCSAData`, body); // { date: "MM/DD/YYYY" }
      } catch (e) {
        console.log(e);
        return e;
      }
    },
  },
  ps: {
    url: "/pharmsaver",
    async getSearchResults(body) {
      try {
        return await client.post(`${this.url}/getSearchResults`, body);
      } catch (e) {
        console.log(e);
        return e;
      }
    },
  },
};
