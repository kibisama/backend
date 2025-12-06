const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = process.env.CLIENT_ADDRESS;
const jwt = require("jsonwebtoken");
const generateToken = () => jwt.sign("", process.env.JWT_ACCESS_TOKEN_SECRET);

module.exports = {
  url: "/system",
  async refresh_cache_delivery(invoiceCode) {
    try {
      return await client.get(
        `${this.url}/refresh_cache/delivery/${invoiceCode}`,
        {
          headers: { Authorization: `Bearer ${generateToken()}` },
        }
      );
    } catch (e) {
      console.log(e);
      return e;
    }
  },
};
