const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = "http://localhost:3002";

module.exports = {
  cardinal: {
    url: "/cardinal",
    async getInvoice(date) {
      try {
        return await client.post(`${this.url}/getInvoice`, date);
      } catch (e) {
        console.log(e);
      }
    },
    async updateItem(ndc11) {
      try {
        return await client.post(`${this.url}/updateItem`, ndc11);
      } catch (e) {
        console.log(e);
      }
    },
  },
};
