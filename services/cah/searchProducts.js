// const dayjs = require("dayjs");
// const { scheduleJob } = require("node-schedule");
// const { cardinal } = require("../../api/puppet");
// const findRelatedNDCs = require("../rxnav/findRelatedNDCs");

// /**
//  * @typedef {import("./getProductDetails").Alt} Alt
//  * @typedef {object} Data
//  * @property {[Alt]} results
//  * @typedef {object} Body
//  * @property {[string]} queries
//  */

// /**
//  * Returns a native Date object indicating m minutes from now.
//  * @param {Parameters<dayjs.Dayjs["add"]>["0"]} m
//  * @returns {Date}
//  */
// const setDelay = (m) => {
//   return dayjs().add(m, "minute").toDate();
// };

// /**
//  * @param {string} ndc
//  * @returns {Promise<Body|undefined>}
//  */
// const getQueries = async (ndc) => {
//   try {
//     const queries = await findRelatedNDCs(ndc);
//     if (queries) {
//       return { queries };
//     }
//   } catch (e) {
//     console.log(e);
//   }
// };

// /**
//  * @param {string} ndc
//  * @param {Function} callback
//  * @returns {undefined}
//  */
// module.exports = async (ndc, callback) => {
//   const queries = await getQueries(ndc);
//   if (!queries) {
//     //
//     return;
//   }
//   let count = 0;
//   const maxCount = 99;
//   async function request() {
//     try {
//       const result = await cardinal.searchProducts(queries);
//       if (result instanceof Error) {
//         switch (result.status) {
//           case 404:
//             // await handle404();
//             break;
//           case 500:
//             if (count < maxCount) {
//               count++;
//               scheduleJob(setDelay(5), request);
//             }
//             break;
//           case 503:
//             scheduleJob(setDelay(3), request);
//             break;
//           default:
//         }
//       } else {
//         /** @type {Data} */
//         const data = result.data;
//         callback(data.results);
//       }
//     } catch (e) {
//       console.log(e);
//     }
//   }
//   request();
// };
