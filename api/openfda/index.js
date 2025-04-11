// const axios = require("axios");
// const client = axios.create();
// client.defaults.baseURL = "https://api.fda.gov";
// const apiKey = process.env.OPENFDA_API_KEY;

// module.exports = {
//   ndc: {
//     url: `drug/ndc.json${apiKey ? "?api_key=" + apiKey + "&" : "?"}`,
//     async searchOneByPackageDescription(_query) {
//       const query = `${this.url}search=packaging.description:${_query}&limit=1`;
//       try {
//         return await client.get(query);
//       } catch (e) {
//         console.log(e);
//         return e;
//       }
//     },
//   },
// };
