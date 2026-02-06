const axios = require("axios");
const client = axios.create();
client.defaults.baseURL = process.env.CLIENT_ADDRESS;
const jwt = require("jsonwebtoken");
const generateToken = () =>
  jwt.sign({ sub: "api" }, process.env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: "1m",
  });

module.exports = {
  async getUsers() {
    return await client.get("api/users", {
      headers: { Authorization: `Bearer ${generateToken()}` },
    });
  },
};
